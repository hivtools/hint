"""Taking in an input file for the version in a request: checking it, storing it, recording it and validating it.

Each file type has a row in `INPUT_FILE_TYPES`, which says all that this API knows about the type: its URL, the
extensions that hintr accepts and the size limit of an upload. The routers, the size limit middleware and the tests read
the rows. Nothing else lists the file types. The limits are not settings: a change to one is a change to the code.

`InputFileService.save` is the one way a new file becomes a version's file. An upload and an import from ADR
(`app/services/adr_imports.py`) call it. A rehydrate will call it too, with the bytes that it got. An import also calls
`refuse_wrong_extension` before it downloads the file, so that a file of the wrong type is not downloaded.

The rule that matters most: once the file is stored and recorded, a failed validation is answered and not raised. A
raised error rolls back the request's transaction, which would drop the new file from the version. The user must keep
the new file and see why it is not valid (and the Vue app has already taken the old file off the screen).
"""

import re
from dataclasses import dataclass
from typing import IO, Annotated

from fastapi import Depends, Header

from app import schemas
from app.clients.hintr_client import BASELINE_TYPES, Hintr, HintrClient
from app.clients.responses import HintResponse
from app.config import Settings, get_settings
from app.errors import EmptyFileNameError, HintError, InvalidFileExtensionError, MissingShapeFileError
from app.schemas import FileType
from app.services.version_files import Files, VersionFiles
from app.storage.uploads import UploadStorage, file_extension


@dataclass(frozen=True)
class InputFileType:
    file_type: FileType
    # What hintr accepts as the extension (it says "File must be of type ..." for any other). The check is made here as
    # well, so that a file of another kind is not written to the share.
    extensions: tuple[str, ...]
    # The most that one upload of this type (the whole request that uploads it) may be, in bytes (see
    # app/upload_limit.py). It is also the most that an import from ADR may download (see app/services/adr_imports.py).
    max_upload_bytes: int

    @property
    def is_baseline(self) -> bool:
        """hintr validates a baseline file alone, and any other file against the shape file."""
        return self.file_type in BASELINE_TYPES

    @property
    def url(self) -> str:
        """The URL of its upload, get and delete calls."""
        return f"/{'baseline' if self.is_baseline else 'disease'}/{self.file_type.value}"


MB = 1024 * 1024

# Each limit is about twice the largest file of its kind that a saved version used in November 2026 (the files of 1,000
# to 1,800 versions for PJNZ, programme and ANC, and 200 to 300 for the others). A user on a slow connection hits Azure's
# limit first: a request that takes more than 240 seconds is cancelled by the ingress. These are for the input files, and
# not for output zips (the largest a version used was 234 MB): the endpoint that loads one will need a limit of its own.
# Each upload in flight also takes its size of ephemeral disk (see app/upload_limit.py: about 10 of the largest fit at
# 1 vCPU).
INPUT_FILE_TYPES = {
    spec.file_type: spec
    for spec in (
        # A subnational PJNZ is large, and may be a zip: the largest was 187 MB
        InputFileType(FileType.PJNZ, ("PJNZ", "zip"), 400 * MB),
        # The largest was 44 MB
        InputFileType(FileType.SHAPE, ("geojson",), 100 * MB),
        # The largest was 67 MB
        InputFileType(FileType.POPULATION, ("csv",), 150 * MB),
        # The largest was 25 MB
        InputFileType(FileType.SURVEY, ("csv",), 50 * MB),
        # The largest was 8 MB
        InputFileType(FileType.PROGRAMME, ("csv",), 20 * MB),
        # The largest was under 1 MB
        InputFileType(FileType.ANC, ("csv",), 10 * MB),
    )
}


def upload_limit(path: str) -> int | None:
    """The size limit of a path that uploads a file, or None if the path does not upload one. The rows are read at each
    call, so that a test can change a limit."""
    return next((spec.max_upload_bytes for spec in INPUT_FILE_TYPES.values() if spec.url == path), None)


def _wrong_extension(spec: InputFileType, filename: str) -> InvalidFileExtensionError | None:
    """The error for a file of another kind than the type, or None if the extension is a good one. It is what hintr sees in
    the name of the stored file, which is the text after the last dot (and only letters and digits, as R's
    `tools::file_ext` has it)."""
    extension = file_extension(filename)
    if extension.lower() in (allowed.lower() for allowed in spec.extensions):
        return None
    return InvalidFileExtensionError(
        list(spec.extensions), extension if re.fullmatch("[A-Za-z0-9]+", extension) else ""
    )


class InputFileService:
    """The input files of the version in the request, as hintr validates them.

    Both methods return the answer for the browser: hintr's validation, or the error that the user should see. It is
    a `HintResponse`, as hintr's own answer is, so a caller can also read whether the file is valid.
    """

    def __init__(self, files: VersionFiles, storage: UploadStorage, hintr: HintrClient, accept_language: str | None):
        self._files = files
        self._storage = storage
        self._hintr = hintr
        self._accept_language = accept_language

    async def refuse_wrong_extension(self, file_type: FileType, filename: str) -> HintResponse | None:
        """The answer that refuses a file whose name has an extension that the type does not have, or None if the
        extension is a good one. Check this before the file is received, written or downloaded.

        A refused file is not written, and the version's file of this type is taken off: the Vue app has already taken it
        off the screen when the upload or import started.
        """
        refused = _wrong_extension(INPUT_FILE_TYPES[file_type], filename)
        if refused is None:
            return None
        await self._files.remove(file_type)
        return self._answer(refused)

    async def save(
        self,
        file_type: FileType,
        source: IO[bytes],
        filename: str,
        resource_url: str | None = None,
    ) -> HintResponse:
        """Makes the file the version's file of this type, in place of the old one, and asks hintr to validate it.

        - A file with no name is refused (400).
        - A name with an extension that the type does not have is refused (see `refuse_wrong_extension`).
        - Otherwise the file is written to the share, then recorded, so no database row points at a missing file. The
          version keeps it even if it is not valid.

        The source must support `seek` (see `UploadStorage.save`). A file imported from ADR has a `resource_url`: its link
        on ADR, which can be empty (see `AdrClient.resource_url`). The version records it as from ADR. An upload has none.
        """
        if not filename:
            raise EmptyFileNameError()
        refused = await self.refuse_wrong_extension(file_type, filename)
        if refused is not None:
            return refused
        file_hash = await self._storage.save(source, filename)
        saved = await self._files.record(
            file_type,
            schemas.VersionFile(
                hash=file_hash, filename=filename, from_adr=resource_url is not None, resource_url=resource_url
            ),
        )
        return await self._validate(file_type, saved)

    async def validate(self, file_type: FileType) -> HintResponse:
        """Asks hintr to validate the version's file of this type again. Only hintr can read what is in a file. A
        success with null data if the version has no file of this type."""
        file = await self._files.get_file(file_type)
        if file is None:
            return HintResponse.success(None)
        return await self._validate(file_type, file)

    async def _validate(self, file_type: FileType, file: schemas.HintrFile) -> HintResponse:
        if INPUT_FILE_TYPES[file_type].is_baseline:
            return await self._hintr.validate_baseline_individual(file_type, file)
        # So the version must have a shape file before the user adds any of the other files
        shape = await self._files.get_file(FileType.SHAPE)
        if shape is None:
            return self._answer(MissingShapeFileError())
        return await self._hintr.validate_survey_and_programme(file_type, file, shape.path)

    def _answer(self, error: HintError) -> HintResponse:
        # Answered and not raised, so that the request's transaction commits (see the top of this module)
        return error.hint_response(self._accept_language)


def get_input_file_service(
    files: Files,
    hintr: Hintr,
    settings: Annotated[Settings, Depends(get_settings)],
    accept_language: Annotated[str | None, Header()] = None,
) -> InputFileService:
    return InputFileService(files, UploadStorage(settings.upload_dir), hintr, accept_language)


InputFiles = Annotated[InputFileService, Depends(get_input_file_service)]
