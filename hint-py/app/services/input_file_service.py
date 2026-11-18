"""Taking in an input file for the version in a request: checking it, storing it, recording it and validating it.

Each file type has a row in `INPUT_FILE_TYPES`, which says all that this API knows about the type: its URL, the
extensions that hintr accepts and the size limit of an upload. The routers, the size limit middleware and the tests read
the rows. Nothing else lists the file types.

`InputFileService.accept` is the one way a new file becomes a version's file. An upload calls it now. An import from ADR
and a rehydrate will call it too, with the bytes that they got.

The rule that matters most: once the file is stored and recorded, a failed validation is answered and not raised. A
raised error rolls back the request's transaction, which would drop the new file from the version. The user must keep
the new file and see why it is not valid (and the Vue app has already taken the old file off the screen).
"""

import re
from collections.abc import Callable
from dataclasses import dataclass
from typing import Annotated, BinaryIO

from fastapi import Depends, Header
from fastapi.responses import JSONResponse, Response

from app import schemas
from app.clients.hintr_client import BASELINE_TYPES, Hintr, HintrClient
from app.config import Settings, get_settings
from app.errors import (
    EmptyFileNameError,
    HintError,
    InvalidFileExtensionError,
    MissingShapeFileError,
    hint_error_response,
)
from app.schemas import FileType, success
from app.services.version_files import Files, VersionFiles
from app.storage.uploads import UploadStorage, file_extension


@dataclass(frozen=True)
class InputFileType:
    file_type: FileType
    # What hintr accepts as the extension (it says "File must be of type ..." for any other). The check is made here as
    # well, so that a file of another kind is not written to the share.
    extensions: tuple[str, ...]
    # The most that one upload of this type may be, in bytes (see app/upload_limit.py)
    max_upload_bytes: Callable[[Settings], int]

    @property
    def is_baseline(self) -> bool:
        """hintr validates a baseline file alone, and any other file against the shape file."""
        return self.file_type in BASELINE_TYPES

    @property
    def url(self) -> str:
        """The URL of its upload, get and delete calls."""
        return f"/{'baseline' if self.is_baseline else 'disease'}/{self.file_type.value}"


INPUT_FILE_TYPES = {
    spec.file_type: spec
    for spec in (
        InputFileType(FileType.PJNZ, ("PJNZ", "zip"), lambda s: s.max_pjnz_upload_bytes),
        InputFileType(FileType.SHAPE, ("geojson",), lambda s: s.max_shape_upload_bytes),
        InputFileType(FileType.POPULATION, ("csv",), lambda s: s.max_population_upload_bytes),
        InputFileType(FileType.SURVEY, ("csv",), lambda s: s.max_survey_upload_bytes),
        InputFileType(FileType.PROGRAMME, ("csv",), lambda s: s.max_programme_upload_bytes),
        InputFileType(FileType.ANC, ("csv",), lambda s: s.max_anc_upload_bytes),
    )
}

# The size limit of each path that uploads a file
UPLOAD_LIMITS = {spec.url: spec.max_upload_bytes for spec in INPUT_FILE_TYPES.values()}


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

    Both methods return the response for the browser: hintr's validation, or the error that the user should see.
    """

    def __init__(self, files: VersionFiles, storage: UploadStorage, hintr: HintrClient, accept_language: str | None):
        self._files = files
        self._storage = storage
        self._hintr = hintr
        self._accept_language = accept_language

    async def upload(self, file_type: FileType, source: BinaryIO, filename: str) -> Response:
        """Makes the file the version's file of this type, in place of the old one, and asks hintr to validate it.

        - A name with an extension that the type does not have: nothing is written, and the version's file of this type
          is taken off (the Vue app has already taken it off the screen when the upload started).
        - Otherwise the file is written to the share, then recorded, so no database row points at a missing file. The
          version keeps it even if it is not valid.

        The source must support `seek` (see `UploadStorage.save`).
        """
        if not filename:
            raise EmptyFileNameError()
        refused = _wrong_extension(INPUT_FILE_TYPES[file_type], filename)
        if refused is not None:
            await self._files.remove(file_type)
            return self._answer(refused)
        file_hash = await self._storage.save(source, filename)
        saved = await self._files.record(
            file_type, schemas.VersionFile(hash=file_hash, filename=filename, from_adr=False, resource_url=None)
        )
        return await self._validate(file_type, saved)

    async def validate(self, file_type: FileType) -> Response:
        """Asks hintr to validate the version's file of this type again. Only hintr can read what is in a file. A
        success with null data if the version has no file of this type."""
        file = await self._files.get_file(file_type)
        if file is None:
            return JSONResponse(success(None).model_dump())
        return await self._validate(file_type, file)

    async def _validate(self, file_type: FileType, file: schemas.HintrFile) -> Response:
        if INPUT_FILE_TYPES[file_type].is_baseline:
            return await self._hintr.validate_baseline_individual(file_type, file)
        # So the version must have a shape file before the user adds any of the other files
        shape = await self._files.get_file(FileType.SHAPE)
        if shape is None:
            return self._answer(MissingShapeFileError())
        return await self._hintr.validate_survey_and_programme(file_type, file, shape.path)

    def _answer(self, error: HintError) -> Response:
        # Answered and not raised, so that the request's transaction commits (see the top of this module)
        return hint_error_response(error, self._accept_language)


def get_input_file_service(
    files: Files,
    hintr: Hintr,
    settings: Annotated[Settings, Depends(get_settings)],
    accept_language: Annotated[str | None, Header()] = None,
) -> InputFileService:
    return InputFileService(files, UploadStorage(settings.upload_dir), hintr, accept_language)


InputFiles = Annotated[InputFileService, Depends(get_input_file_service)]
