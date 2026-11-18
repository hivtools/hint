"""Endpoints that upload, validate and remove the input files of a version, and `POST /session/files`.
(Kotlin: BaselineController, DiseaseController and SessionController.)

Each file type in `INPUT_FILE_TYPES` has the same three calls:
- upload: saves the file and validates it.
- get: validates the file again. Only hintr can read the content of a file.
- delete: removes the file from the version.

What each call does to a file is in `app/services/input_file_service.py` (`InputFileService`). This module only turns
the HTTP request into a call of it.

These calls do not need a logged-in user. Guests upload files too.

This module has no VMMC file, because nothing uses it now. The Kotlin app serves `/disease/vmmc` until the front end
stops calling it. `POST /session/files` ignores a VMMC file in an old project.
"""

from typing import Annotated

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import Response

from app import schemas
from app.clients.hintr_client import BASELINE_TYPES, Hintr
from app.schemas import FileType, SuccessResponse, empty_success, success
from app.services.input_file_service import INPUT_FILE_TYPES, InputFiles, InputFileType
from app.services.version_files import Files

router = APIRouter(tags=["input files"])

# The files of a version: one file for each file type that has a file. A file type with no file is null.
SessionFiles = dict[FileType, schemas.VersionFile | None]


def _add_routes(spec: InputFileType) -> None:
    file_type = spec.file_type
    name = file_type.value

    @router.post(
        spec.url, name=f"upload_{name}", summary=f"Upload the {name} file and validate it", response_model=None
    )
    async def upload(file: Annotated[UploadFile, File()], input_files: InputFiles) -> Response:
        return (await input_files.upload(file_type, file.file, file.filename or "")).response()

    @router.get(spec.url, name=f"get_{name}", summary=f"Get the {name} file and validate it again", response_model=None)
    async def get(input_files: InputFiles) -> Response:
        return (await input_files.validate(file_type)).response()

    @router.delete(spec.url, name=f"delete_{name}", summary=f"Remove the {name} file")
    async def delete(files: Files) -> SuccessResponse[bool]:
        await files.remove(file_type)
        return empty_success()


for spec in INPUT_FILE_TYPES.values():
    _add_routes(spec)


@router.get("/baseline/validate", summary="Validate the baseline files against each other")
async def validate_baseline(files: Files, hintr: Hintr) -> Response:
    return (await hintr.validate_baseline_combined(await files.get_files(*BASELINE_TYPES))).response()


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
