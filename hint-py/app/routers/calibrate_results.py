"""The results of a calibration that hint reads itself (Kotlin: CalibrateController, CalibrateDataService).

The results database is found by app/services/task_results.py. The rows are read from it here, which is much quicker than hintr
making them. The calls that hintr answers whole are in app/routers/hintr_forwards.py. None of these need a logged in
user: guests calibrate too.

Kotlin also has `GET /calibrate/result/data/{id}/{indicator}`, which is not ported because the Vue app does not call it.
"""

from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response

from app.clients.responses import HintResponse
from app.db.calibrate_data_repository import read_filtered_calibrate_data
from app.schemas import FilterQuery
from app.services.task_results import Results

router = APIRouter(tags=["calibrate"])


@router.post("/calibrate/result/filteredData/{task_id}")
async def filtered_calibrate_data(task_id: str, filter_query: FilterQuery, results: Results) -> Response:
    path = await results.calibration_database(task_id)
    rows = await run_in_threadpool(read_filtered_calibrate_data, path, filter_query)
    # The rows are already JSON text, up to 70 MB of it, so they go into the envelope as text and are not parsed
    return HintResponse.success_from_json(rows.encode()).response()
