"""The charts and metadata of the review inputs page (Kotlin: ChartDataController and MetadataController).

hint says which files of the version each one is made from, and hintr reads them from the uploads folder. None of these
need a logged in user: guests review inputs too.
"""

from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel

from app.clients.hintr_client import Hintr
from app.errors import HintError
from app.schemas import FileType
from app.services.version_files import Files

router = APIRouter(tags=["hintr"])


class UnknownInputTimeSeriesTypeError(HintError):
    def __init__(self):
        super().__init__("unknownInputTimeSeriesType", 400)


class UnknownReviewInputFileTypeError(HintError):
    def __init__(self):
        super().__init__("unknownReviewInputFileType", 400)


# The time series of each type is drawn with these other files too
TIME_SERIES_FILES = {
    FileType.ANC: [FileType.ANC, FileType.SHAPE],
    FileType.PROGRAMME: [FileType.PROGRAMME, FileType.SHAPE, FileType.PJNZ],
}

# The types that the metadata of the review inputs can be asked for
REVIEW_TYPES = {FileType.ANC, FileType.PROGRAMME, FileType.SURVEY, FileType.SHAPE}


@router.get("/chart-data/input-time-series/{series_type}")
async def input_time_series(series_type: str, files: Files, hintr: Hintr) -> Response:
    # Any case: "ANC" and "anc" are the same
    try:
        file_type = FileType(series_type.lower())
        wanted = TIME_SERIES_FILES[file_type]
    except ValueError, KeyError:
        raise UnknownInputTimeSeriesTypeError() from None
    return await hintr.input_time_series(file_type, await files.get_files(*wanted))


@router.get("/chart-data/input-comparison")
async def input_comparison(files: Files, hintr: Hintr) -> Response:
    return await hintr.input_comparison(
        await files.get_files(FileType.SHAPE, FileType.PJNZ, FileType.ANC, FileType.PROGRAMME)
    )


@router.get("/chart-data/input-population")
async def input_population(files: Files, hintr: Hintr) -> Response:
    return await hintr.input_population(await files.get_files(FileType.POPULATION))


class ReviewInputsRequest(BaseModel):
    types: list[str]


@router.post("/meta/review-inputs/{iso3}")
async def review_inputs_metadata(iso3: str, body: ReviewInputsRequest, files: Files, hintr: Hintr) -> Response:
    # Each type, in the case it was asked for in, is sent with its file, or with null if the version has none
    wanted = {}
    for name in body.types:
        try:
            file_type = FileType(name.lower())
        except ValueError:
            raise UnknownReviewInputFileTypeError() from None
        if file_type not in REVIEW_TYPES:
            raise UnknownReviewInputFileTypeError()
        wanted[name] = file_type
    found = await files.get_files(*wanted.values())
    return await hintr.review_input_metadata(iso3, {name: found.get(file_type) for name, file_type in wanted.items()})
