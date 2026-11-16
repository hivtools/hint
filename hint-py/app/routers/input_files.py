"""Endpoints that upload, validate and remove the input files of a version, and `POST /session/files`.
(Kotlin: BaselineController, DiseaseController and SessionController.)

Each file type has the same three calls:
- upload: saves the file and validates it.
- get: validates the file again. Only hintr can read the content of a file.
- delete: removes the file from the version.

These calls do not need a logged-in user. Guests upload files too.

This module has no VMMC file, because nothing uses it now. The Kotlin app serves `/disease/vmmc` until the front end
stops calling it.
"""

from typing import Annotated

from fastapi import APIRouter, File, Header, UploadFile
from fastapi.responses import JSONResponse, Response

from app import schemas
from app.clients.hintr_client import Hintr
from app.errors import EmptyFileNameError, HintError, MissingShapeFileError, hint_error_response
from app.schemas import FileType, SuccessResponse, empty_success, success
from app.services.version_files import Files

router = APIRouter(tags=["input files"])

# The URL name of each file type, as in Kotlin. The baseline files and the disease files have different URL prefixes.
BASELINE_FILES = {"pjnz": FileType.PJNZ, "shape": FileType.SHAPE, "population": FileType.POPULATION}
DISEASE_FILES = {"survey": FileType.SURVEY, "programme": FileType.PROGRAMME, "anc": FileType.ANC}

# The baseline file types. hintr validates them against each other.
BASELINE_TYPES = list(BASELINE_FILES.values())

# The files of a version: one file for each file type that has a file. A file type with no file is null.
SessionFiles = dict[FileType, schemas.VersionFile | None]


async def _validate(file_type: FileType, file: schemas.HintrFile, files: Files, hintr: Hintr) -> Response:
    """Asks hintr to validate the file for its file type.

    hintr validates a baseline file alone.
    hintr validates the other files against the shape file. So the version must have a shape file before the user
    uploads the other files. A PJNZ file is not needed (D10).
    """
    if file_type in BASELINE_TYPES:
        return await hintr.validate_baseline_individual(file_type, file)
    shape = await files.get_file(FileType.SHAPE)
    if shape is None:
        raise MissingShapeFileError()
    return await hintr.validate_survey_and_programme(file_type, file, shape.path)


def _add_routes(url: str, file_type: FileType) -> None:
    name = file_type.value

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
        # The version keeps the new file even if the validation fails. Kotlin does the same. The Vue app also shows this:
        # it removes the old file from the screen when an upload starts. A missing PJNZ or shape file is returned, not
        # raised. A raised error rolls back the database, and then the version would lose the new file.
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


for _name, _file_type in {**BASELINE_FILES, **DISEASE_FILES}.items():
    _add_routes(f"/{'baseline' if _file_type in BASELINE_TYPES else 'disease'}/{_name}", _file_type)


@router.get("/baseline/validate", summary="Validate the baseline files against each other")
async def validate_baseline(files: Files, hintr: Hintr) -> Response:
    found = await files.get_files(*BASELINE_TYPES)
    return await hintr.validate_baseline_combined({file_type: found.get(file_type) for file_type in BASELINE_TYPES})


@router.post("/session/files", summary="Set all the files of the version")
async def set_files(body: SessionFiles, files: Files) -> SuccessResponse[SessionFiles]:
    """Replaces all the files of the version, for example when the user loads a project.

    The files must be uploaded before. Anyone can have uploaded them. A file type that
    does not exist is a bad request. The Vue app sends back the files of a saved version,
    so the VMMC file of an old project is a valid file type."""
    await files.set_all(body)
    return success(body)
