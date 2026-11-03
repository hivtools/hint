"""Fitting and calibrating the model (Kotlin: ModelRunController and CalibrateController).

Running and validating a fit need the version's uploaded files, which hint adds to the call. The calls that only ask
after a task are in app/routers/hintr_forwards.py. None of these need a logged in user: guests run models too.
"""

from fastapi import APIRouter
from fastapi.responses import Response

from app.clients.hintr_client import Hintr
from app.schemas import FileType, ModelOptions
from app.services.version_files import Files

router = APIRouter(tags=["hintr"])

# What the options form is made from
OPTIONS_FORM_FILES = [FileType.SHAPE, FileType.SURVEY, FileType.PROGRAMME, FileType.ANC]
# What a fit is made from
MODEL_FIT_FILES = [
    FileType.ANC,
    FileType.PJNZ,
    FileType.POPULATION,
    FileType.PROGRAMME,
    FileType.SHAPE,
    FileType.SURVEY,
]


@router.get("/model/options")
async def model_options(files: Files, hintr: Hintr) -> Response:
    return await hintr.forward("POST", "/model/options", json=await files.get(*OPTIONS_FORM_FILES))


@router.post("/model/validate/options")
async def validate_model_options(body: ModelOptions, files: Files, hintr: Hintr) -> Response:
    data = await files.get(*MODEL_FIT_FILES)
    return await hintr.forward("POST", "/validate/options", json={"options": body.options, "data": data})


@router.post("/model/run")
async def run_model(body: ModelOptions, files: Files, hintr: Hintr) -> Response:
    data = await files.get(*MODEL_FIT_FILES)
    return await hintr.forward("POST", "/model/submit", json={**body.model_dump(), "data": data})


@router.post("/calibrate/submit/{run_id}")
async def submit_calibration(run_id: str, body: ModelOptions, hintr: Hintr) -> Response:
    # No files: the calibration is of a fit that hintr already has
    return await hintr.forward("POST", "/calibrate/submit/{run_id}", {"run_id": run_id}, body)
