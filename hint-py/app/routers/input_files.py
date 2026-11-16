"""Endpoints that upload, validate and remove the input files of a version, and `POST /session/files`.
(Kotlin: BaselineController, DiseaseController and SessionController.)

Each file type has the same three calls:
- upload: saves the file and validates it.
- get: validates the file again. Only hintr can read the content of a file.
- delete: removes the file from the version.

These calls do not need a logged-in user. Guests upload files too.

This module has no VMMC file, because nothing uses it now. The Kotlin app serves `/disease/vmmc` until the front end
stops calling it. `POST /session/files` ignores a VMMC file in an old project.
"""

from typing import Annotated

from fastapi import APIRouter, File, Header, UploadFile
from fastapi.responses import JSONResponse, Response

from app import schemas
from app.clients.hintr_client import BASELINE_TYPES, Hintr
from app.errors import EmptyFileNameError, HintError, MissingShapeFileError, hint_error_response
from app.schemas import FileType, SuccessResponse, empty_success, success
from app.services.version_files import Files

router = APIRouter(tags=["input files"])

# The URL name of each file type, as in Kotlin. The baseline files and the disease files have different URL prefixes.
BASELINE_FILES = {"pjnz": FileType.PJNZ, "shape": FileType.SHAPE, "population": FileType.POPULATION}
DISEASE_FILES = {"survey": FileType.SURVEY, "programme": FileType.PROGRAMME, "anc": FileType.ANC}

# The setting that has the size limit of each type of file
LIMIT_SETTINGS = {
    FileType.PJNZ: "max_pjnz_upload_bytes",
    FileType.SHAPE: "max_shape_upload_bytes",
    FileType.POPULATION: "max_population_upload_bytes",
    FileType.SURVEY: "max_survey_upload_bytes",
    FileType.PROGRAMME: "max_programme_upload_bytes",
    FileType.ANC: "max_anc_upload_bytes",
}

# The paths that upload a file, and the setting that has the size limit of each (see `app.upload_limit`)
UPLOAD_LIMITS: dict[str, str] = {}

# The files of a version: one file for each file type that has a file. A file type with no file is null.
SessionFiles = dict[FileType, schemas.VersionFile | None]


async def _validate(file_type: FileType, file: schemas.HintrFile, files: Files, hintr: Hintr) -> Response:
    """Asks hintr to validate the file for its file type.

    hintr validates a baseline file alone.
    hintr validates the other files against the shape file. So the version must have a shape file before the user
    uploads the other files.
    """
    if file_type in BASELINE_TYPES:
        return await hintr.validate_baseline_individual(file_type, file)
    shape = await files.get_file(FileType.SHAPE)
    if shape is None:
        raise MissingShapeFileError()
    return await hintr.validate_survey_and_programme(file_type, file, shape.path)


def _add_routes(url: str, file_type: FileType) -> None:
    name = file_type.value
    UPLOAD_LIMITS[url] = LIMIT_SETTINGS[file_type]

    @router.post(url, name=f"upload_{name}", summary=f"Upload the {name} file and validate it", response_model=None)
    async def upload(
        file: Annotated[UploadFile, File()],
        files: Files,
        hintr: Hintr,
        accept_language: Annotated[str | None, Header()] = None,
    ) -> Response:
        if not file.filename:
            raise EmptyFileNameError()
        saved = await files.save_upload(file_type, file.file, file.filename)
        # We want the version to keep the new file even if the validation fails. If the validation
        # fails because the shape file is missing this raises a `MissingShapeFileError`.
        # A raised error makes the request DB transaction roll back, so the new file would
        # be dropped from the version.
        # So we need to catch the error here and return it as a normal response so the
        # transaction commits, the file is kept on disk and the user sees the error.
        try:
            return await _validate(file_type, saved, files, hintr)
        except HintError as error:
            return hint_error_response(error, accept_language)

    @router.get(url, name=f"get_{name}", summary=f"Get the {name} file and validate it again", response_model=None)
    async def get(files: Files, hintr: Hintr) -> Response:
        file = await files.get_file(file_type)
        if file is None:
            return JSONResponse(success(None).model_dump())
        return await _validate(file_type, file, files, hintr)

    @router.delete(url, name=f"delete_{name}", summary=f"Remove the {name} file")
    async def delete(files: Files) -> SuccessResponse[bool]:
        await files.remove(file_type)
        return empty_success()


for name, file_type in BASELINE_FILES.items():
    _add_routes(f"/baseline/{name}", file_type)
for name, file_type in DISEASE_FILES.items():
    _add_routes(f"/disease/{name}", file_type)


@router.get("/baseline/validate", summary="Validate the baseline files against each other")
async def validate_baseline(files: Files, hintr: Hintr) -> Response:
    return await hintr.validate_baseline_combined(await files.get_files(*BASELINE_TYPES))


@router.post("/session/files", summary="Set all the files of the version")
async def set_files(body: SessionFiles, files: Files) -> SuccessResponse[SessionFiles]:
    """Replaces all the files of the version, for example when the user loads a project.

    The files must be uploaded before. Anyone can have uploaded them. A file type that
    does not exist is a bad request. The Vue app sends back the files of a saved version,
    so the VMMC file of an old project is a valid file type. It is ignored: nothing uses
    VMMC files now, so the version does not get it, and the response does not have it."""
    wanted = {file_type: file for file_type, file in body.items() if file_type != FileType.VMMC}
    await files.set_all(wanted)
    return success(wanted)
