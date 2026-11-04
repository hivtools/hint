"""Asking for a download of the outputs of a model (Kotlin: DownloadController).

The status of a download is in app/routers/hintr_forwards.py. None of these need a logged in user: guests download too.
"""

from typing import Annotated, Any

from fastapi import APIRouter, Body
from fastapi.responses import Response

from app.clients.hintr_client import Hintr
from app.schemas import FileType
from app.services.version_files import Files

router = APIRouter(tags=["hintr"])


@router.post("/download/submit/{download_type}/{task_id}")
async def submit_download(
    download_type: str,
    task_id: str,
    files: Files,
    hintr: Hintr,
    body: Annotated[dict[str, Any] | None, Body()] = None,
) -> Response:
    """The body is what the browser sends (the state, notes and iso3), to which hint adds a file for some types.

    The version is checked for every type, though only some use its files."""
    payload = dict(body or {})
    if download_type == "agyw":
        # Always added, as null if the version has no PJNZ file (hintr then answers with the error)
        payload["pjnz"] = await files.get_file(FileType.PJNZ)
    elif download_type in ("spectrum", "datapack"):
        vmmc = await files.get_file(FileType.VMMC)
        if vmmc is not None:
            payload["vmmc"] = vmmc
    return await hintr.submit_download(download_type, task_id, payload)
