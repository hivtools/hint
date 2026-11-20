"""Loading a project from an output zip (rehydrate).

An output zip is made by this app. It has the state of the project in it (what the Vue app saves as it is used), and the
notes of the project. The Vue app reads that state and sets up the project from it. This module does two things:

- It reads the state and the notes from the zip. Only two entries are read (`PROJECT_STATE_PATH` and `NOTES_PATH`), and
  only up to a limit (see `app/utils/zip_files.py`). Nothing is extracted and nothing is stored.
- It checks that the state can be used here. The input files that it names must be in the uploads folder, and the model
  fit and the calibration must be tasks that hintr knows. If not, the Vue app would set up a project that has no files
  or no results.

The zip comes from an upload (`RehydrateService.from_upload`) or from ADR (`RehydrateService.from_adr`). Both give a file
on the disk (in memory when it is small) that can seek, which the zip format needs. The answer is the same for both.

The size limit of the zip itself is `OUTPUT_ZIP` in app/services/file_types.py. It is applied to the request (see
app/middleware/upload_limit.py) and to the download from ADR.

A project does not get any files from this. The Vue app sets the files of the version with `POST /session/files`, using
the hashes in the state. It can do that only for files that were uploaded before.
"""

import asyncio
from typing import IO, Annotated, Any

import structlog
from fastapi import Depends
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator
from pydantic_core import from_json

from app.clients.adr_client import Adr, AdrClient
from app.clients.hintr_client import Hintr, HintrClient
from app.clients.responses import HintResponse
from app.config import Settings, get_settings
from app.errors import (
    FailedZipRehydrateError,
    RehydrateCalibrateIdUnknownError,
    RehydrateMissingInputFileError,
    RehydrateModelFitIdUnknownError,
)
from app.schemas import AdrResource
from app.services import file_types
from app.storage.uploads import UploadStorage
from app.utils.byte_limit import MB
from app.utils.zip_files import UnreadableZipError, read_entries

log = structlog.get_logger()

# The entries of the zip that are read. The names are exact.
PROJECT_STATE_PATH = "info/project_state.json"
NOTES_PATH = "notes.txt"

# The most that is read of one entry, in bytes. The state of a real project is some hundreds of KB. The state is also read
# into memory as JSON, which takes several times its size.
MAX_STATE_BYTES = 20 * MB
# The notes of a project are some lines of text
MAX_NOTES_BYTES = 1 * MB


class _Dataset(BaseModel):
    """What the state says of an input file: the path of the file as hintr saw it. It has other fields, which are not used."""

    model_config = ConfigDict(strict=True)

    path: str

    @property
    def stored_name(self) -> str:
        """The name of the file in the uploads folder. The path is the one that hintr saw, in its own mount of the share:
        only the last part is the name."""
        return self.path.rsplit("/", 1)[-1]


class _Task(BaseModel):
    """What the state says of the model fit, or of the calibration. It has other fields, which are not used."""

    model_config = ConfigDict(strict=True)

    id: str = Field(min_length=1)


class _State(BaseModel):
    """The parts of the project state that are checked. Any other part is not looked at.

    Only a wrong `datasets` fails the validation, because the checks are made in order: the input files come first, then
    the model fit, then the calibration, and the first that fails is the error. A task of a wrong shape is None here, and
    is refused in its turn.
    """

    model_config = ConfigDict(strict=True)

    datasets: dict[str, _Dataset] = {}
    model_fit: _Task | None = None
    calibrate: _Task | None = None

    @field_validator("datasets", mode="before")
    @classmethod
    def _no_datasets_if_not_an_object(cls, value: Any) -> Any:
        # `datasets` that is not an object names no files. The same for `null`.
        return value if isinstance(value, dict) else {}

    @field_validator("model_fit", "calibrate", mode="wrap")
    @classmethod
    def _wrong_task_is_none(cls, value: Any, handler: Any) -> Any:
        try:
            return handler(value)
        except ValidationError:
            return None


def _parse_state(content: bytes) -> Any:
    """The JSON of the state, as it was written. `NaN` and `Infinity` are refused: they are not JSON, and the browser could
    not read them back."""
    try:
        return from_json(content, allow_inf_nan=False)
    # A value that is not UTF-8, not JSON, or has nesting that is too deep
    except ValueError:
        log.warning("The project state in the output zip is not JSON")
        raise FailedZipRehydrateError from None


def _check_shape(state: Any) -> _State:
    """The state with the parts that are checked, if they have the shape that they should have.

    Raises `FailedZipRehydrateError` if the state is not an object (it was not made by the web app), and
    `RehydrateMissingInputFileError` if the datasets are not as they should be (a dataset that has no path has no file).
    """
    if not isinstance(state, dict):
        log.warning("The project state in the output zip is not an object")
        raise FailedZipRehydrateError
    try:
        return _State.model_validate(state)
    except ValidationError:
        raise RehydrateMissingInputFileError from None


class RehydrateService:
    """Loads a project from an output zip. Each method answers with a `HintResponse`: `{notes, state}` for the Vue app,
    or the failure of the download from ADR. It raises one of the errors of the checks (all 400), or the failure of
    hintr if it cannot say whether a task exists."""

    def __init__(self, hintr: HintrClient, adr: AdrClient, storage: UploadStorage):
        self._hintr = hintr
        self._adr = adr
        self._storage = storage

    async def from_upload(self, output_zip: IO[bytes]) -> HintResponse:
        """The notes and the state of the project in a zip that the user uploaded. The file must support `seek`."""
        return await self._load(output_zip)

    async def from_adr(self, resource: AdrResource) -> HintResponse:
        """The notes and the state of the project in an output zip on ADR.

        The zip is downloaded as the user from ADR's own address, as an import of an input file is (see
        `app/services/adr_imports.py`). If the link is not on ADR, or there is no credential for ADR, the error is raised.
        If the download fails, the failure is the answer.
        """
        file = self._adr.file_at(resource.url)
        async with self._adr.spooled_download(file, file_types.OUTPUT_ZIP.max_upload_bytes) as (
            downloaded,
            content,
        ):
            return await self._load(content) if downloaded.ok else downloaded

    async def _load(self, output_zip: IO[bytes]) -> HintResponse:
        try:
            entries = await asyncio.to_thread(
                read_entries, output_zip, {PROJECT_STATE_PATH: MAX_STATE_BYTES, NOTES_PATH: MAX_NOTES_BYTES}
            )
        except UnreadableZipError as e:
            log.warning("The output zip cannot be read", reason=e.reason)
            raise FailedZipRehydrateError from None
        state_bytes, notes_bytes = entries[PROJECT_STATE_PATH], entries[NOTES_PATH]
        if state_bytes is None:
            log.warning("The output zip has no project state")
            raise FailedZipRehydrateError
        state = _parse_state(state_bytes)
        await self._check(_check_shape(state))
        notes = None if notes_bytes is None else notes_bytes.decode("utf-8", errors="replace")
        # The state is the JSON that was read, not changed. `errors` is null, as in hintr's own answers and as Kotlin sent
        # it here. Other answers have an empty list.
        return HintResponse(200, {"data": {"notes": notes, "state": state}, "errors": None, "status": "success"})

    async def _check(self, state: _State) -> None:
        """The input files come first, then the model fit, then the calibration: the first that fails is the error.

        One check at a time, and not all at once: a missing file must stop the checks before hintr is asked anything.
        """
        for dataset in state.datasets.values():
            if not await self._storage.has_file(dataset.stored_name):
                raise RehydrateMissingInputFileError
        if state.model_fit is None or not await self._hintr.task_exists(state.model_fit.id):
            raise RehydrateModelFitIdUnknownError
        if state.calibrate is None or not await self._hintr.task_exists(state.calibrate.id):
            raise RehydrateCalibrateIdUnknownError


def get_rehydrate_service(
    hintr: Hintr, adr: Adr, settings: Annotated[Settings, Depends(get_settings)]
) -> RehydrateService:
    return RehydrateService(hintr, adr, UploadStorage(settings.upload_dir))


Rehydrate = Annotated[RehydrateService, Depends(get_rehydrate_service)]
