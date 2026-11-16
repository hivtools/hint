"""Uploading, validating and removing the input files of a version (Kotlin: BaselineController, DiseaseController and
SessionController).

Each file type has the same three calls: upload (which validates the file), get (which validates the file again, as
hintr is the only one that knows what is in it) and delete. None of these need a logged in user: guests upload files too.

The VMMC file is not here, as nothing uses it any more. The Kotlin app still serves `/disease/vmmc` until the front end
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

# What the Kotlin app calls each file type in its URLs: the baseline files, then the ones about the disease
BASELINE_FILES = {"pjnz": FileType.PJNZ, "shape": FileType.SHAPE, "population": FileType.POPULATION}
DISEASE_FILES = {"survey": FileType.SURVEY, "programme": FileType.PROGRAMME, "anc": FileType.ANC}

# The files that make up the baseline, which are checked against each other
BASELINE_TYPES = list(BASELINE_FILES.values())

# What a version has saved: a file for each type it has one of (and null for a type it has not)
SessionFiles = dict[FileType, schemas.VersionFile | None]


async def _validate(file_type: FileType, file: schemas.HintrFile, files: Files, hintr: Hintr) -> Response:
    """Asks hintr whether the file is a good one of its type.

    A baseline file is checked alone. The others are checked against the shape file, so that has to be uploaded first.
    They are not checked against the PJNZ file (D10).
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
        # The file is the version's before it is validated, as in the Kotlin app: one that fails to validate replaces
        # the one before it, which is what the Vue app shows (it empties the file before it uploads). A missing
        # prerequisite is an answer, not a raised error, so that the file is kept (raising rolls the database back).
        try:
            return await _validate(file_type, saved, files, hintr)
        except HintError as error:
            return hint_error_response(error, accept_language)

    @router.get(url, name=f"get_{name}", summary=f"The {name} file, validated again", response_model=None)
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


@router.post("/session/files", summary="Set the files of the version, from what was saved with it")
async def set_files(body: SessionFiles, files: Files) -> SuccessResponse[SessionFiles]:
    """Replaces all of the version's files, as when a project is loaded. The files must have been uploaded before (by
    anyone: as in Kotlin there is no check of who, see QUIRKS.md). A type that is not one that exists is a bad request.
    The Vue app sends back what a saved version had, so a VMMC file of an old project is still one that exists."""
    await files.set_all(body)
    return success(body)
