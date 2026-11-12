"""The results of a calibration that hint reads itself (Kotlin: CalibrateController, CalibrateDataService).

hintr is asked only where the results database is. The rows are read from it here, which is much quicker than hintr
making them. The calls that hintr answers whole are in app/routers/hintr_forwards.py. None of these need a logged in
user: guests calibrate too.

Kotlin also has `GET /calibrate/result/data/{id}/{indicator}`, which is not ported because the Vue app does not call it.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response

from app.clients.hintr_client import Hintr
from app.config import Settings, get_settings
from app.db.calibrate_data_repository import read_filtered_calibrate_data
from app.errors import MissingCalibrateDataError
from app.schemas import FilterQuery
from app.services.result_files import find_result_file

router = APIRouter(tags=["calibrate"])


@router.post("/calibrate/result/filteredData/{task_id}")
async def filtered_calibrate_data(
    task_id: str, filter_query: FilterQuery, hintr: Hintr, settings: Annotated[Settings, Depends(get_settings)]
) -> Response:
    path = find_result_file(settings.results_dir, await hintr.calibrate_result_path(task_id), task_id)
    if path is None:
        raise MissingCalibrateDataError
    rows = await run_in_threadpool(read_filtered_calibrate_data, path, filter_query)
    # The rows are already JSON text, so they are put inside the usual {data, errors, status} envelope as text. Going
    # through `success(rows)` would parse them into Python objects and write them out again, which for up to 70 MB of
    # rows costs a lot of time and memory
    return Response(
        content=b'{"data":' + rows.encode() + b',"errors":[],"status":"success"}', media_type="application/json"
    )
