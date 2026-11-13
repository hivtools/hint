"""Downloading the outputs of a model (Kotlin: DownloadController).

The status of a download is in app/routers/hintr_forwards.py. None of these need a logged in user: guests download too.
"""

from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends
from fastapi.responses import FileResponse, Response

from app.clients.hintr_client import Hintr
from app.config import Settings, get_settings
from app.errors import MissingResultFileError
from app.schemas import DownloadMetadata, FileType
from app.services.result_files import find_result_file
from app.services.version_files import Files

router = APIRouter(tags=["hintr"])


def download_filename(metadata: DownloadMetadata, now: datetime) -> str:
    """The name the file is saved as, which hintr gives it when it sends the file itself: the areas, what the file is,
    and when it was downloaded (to the minute, in UTC as in hintr's image), for example MWI_summary-report_20251112-1030.html"""
    return f"{metadata.areas}_{metadata.file_label}_{now.strftime('%Y%m%d-%H%M')}{metadata.file_extension}"


@router.post("/download/submit/{download_type}/{task_id}")
async def submit_download(
    download_type: str,
    task_id: str,
    files: Files,
    hintr: Hintr,
    body: Annotated[dict[str, Any] | None, Body()] = None,
) -> Response:
    """The body is what the browser sends (the state, notes and iso3), to which hint adds the VMMC file for some types.

    The version is checked for every type, though only some use its files."""
    payload = dict(body or {})
    if download_type in ("spectrum", "datapack"):
        # Only ever the version's own file: one in the browser's body is dropped if the version has none
        vmmc = await files.get_file(FileType.VMMC)
        if vmmc is None:
            payload.pop("vmmc", None)
        else:
            payload["vmmc"] = vmmc
    return await hintr.submit_download(download_type, task_id, payload)


@router.get("/download/result/{task_id}")
async def download_result(task_id: str, hintr: Hintr, settings: Annotated[Settings, Depends(get_settings)]) -> Response:
    """The file of a finished download. hintr is asked only where the file is, and it is sent from there in pieces:
    hintr's own call reads all of it into memory, and the files can be hundreds of megabytes."""
    result = await hintr.download_result(task_id)
    path = find_result_file(settings.results_dir, result.path, task_id)
    if path is None:
        raise MissingResultFileError(result.path)
    return FileResponse(
        path,
        media_type="application/octet-stream",
        filename=download_filename(result.metadata, datetime.now(UTC)),
    )
