"""The files that hintr's tasks made: the results database of a calibration, and the file of a download.

hintr is asked where the file of a task is, and the file is then found in the results share, which this API mounts too.
The callers know neither of these: they ask for a task's file and get a path they can open.

The target design (docs/target-design.md, R4) has each task write a manifest, `result.json`, that lists what it made.
When that is built, this module reads the manifest instead of asking hintr, and its callers do not change.
"""

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Annotated

from fastapi import Depends

from app import clock
from app.clients.hintr_client import Hintr, HintrClient
from app.config import Settings, get_settings
from app.errors import MissingCalibrateDataError, MissingResultFileError
from app.schemas import DownloadMetadata
from app.storage.results import find_result_file


def download_filename(metadata: DownloadMetadata, now: datetime) -> str:
    """The name the file is saved as, which hintr gives it when it sends the file itself: the areas, what the file is,
    and when it was downloaded (to the minute, in UTC as in hintr's image), for example MWI_summary-report_20251112-1030.html"""
    return f"{metadata.areas}_{metadata.file_label}_{now.strftime('%Y%m%d-%H%M')}{metadata.file_extension}"


@dataclass(frozen=True)
class DownloadFile:
    path: Path
    # What the browser saves it as
    filename: str


class TaskResults:
    def __init__(self, hintr: HintrClient, results_dir: str):
        self._hintr = hintr
        self._results_dir = results_dir

    async def calibration_database(self, task_id: str) -> Path:
        """The results database of a calibration (a DuckDB file). `MissingCalibrateDataError` if hintr has the
        calibration, but the file is not in the results folder."""
        path = find_result_file(self._results_dir, await self._hintr.calibrate_result_path(task_id), task_id)
        if path is None:
            raise MissingCalibrateDataError
        return path

    async def download_file(self, task_id: str) -> DownloadFile:
        """The file of a finished download, and the name to save it as. If hintr has the download but the file is not in
        the results folder, `MissingResultFileError`, which the user is shown as an unexpected error."""
        result = await self._hintr.download_result(task_id)
        path = find_result_file(self._results_dir, result.path, task_id)
        if path is None:
            raise MissingResultFileError(result.path)
        return DownloadFile(path, download_filename(result.metadata, clock.utc_now()))


def get_task_results(hintr: Hintr, settings: Annotated[Settings, Depends(get_settings)]) -> TaskResults:
    return TaskResults(hintr, settings.results_dir)


Results = Annotated[TaskResults, Depends(get_task_results)]
