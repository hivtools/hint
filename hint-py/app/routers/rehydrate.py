"""Endpoints that load a project from an output zip: one that the user uploads, and one on ADR.

The rules are in `app/services/rehydrate_service.py`. This module only turns the HTTP request into a call of it.

An upload needs no login: a guest can load a zip too. A zip on ADR needs a login, as every call to ADR does (a guest has
no credential for ADR). Neither changes the files of the version: the Vue app does that next, with `POST /session/files`.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import Response

from app.dependencies import current_user, logged_in_user
from app.schemas import AdrResource
from app.services.rehydrate_service import Rehydrate

router = APIRouter(prefix="/rehydrate", tags=["rehydrate"])


@router.post("/zip", dependencies=[Depends(current_user)], response_model=None)
async def rehydrate_zip(file: Annotated[UploadFile, File()], rehydrate: Rehydrate) -> Response:
    """The notes and the state of the project in an output zip that the user uploads."""
    return (await rehydrate.from_upload(file.file)).response()


@router.post("/adr", dependencies=[Depends(logged_in_user)], response_model=None)
async def rehydrate_adr(resource: AdrResource, rehydrate: Rehydrate) -> Response:
    """The notes and the state of the project in an output zip on ADR, which is downloaded as the user."""
    return (await rehydrate.from_adr(resource)).response()
