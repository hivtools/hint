"""The users, and the versions of the guests.

- `GET /user/{email}/exists`: whether a user has this email (ignoring case). The Vue app asks it before it shares or
  copies a project to someone. Only for a logged in user: it tells whether someone has an account.
- `POST /guest/version`: a guest has no projects, so each guest tab asks for a version of its own here. The session
  remembers which versions it gave out, and only those are the guest's (see `current_version_id`).
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response

from app import schemas
from app.db.user_repository import UserRepository, get_user_repository
from app.db.web_session_repository import WebSessionRepository, get_web_session_repository
from app.dependencies import LoggedInUser, Versions
from app.errors import GuestsOnlyError
from app.services.web_sessions import CurrentWebSession, Sessions

router = APIRouter(tags=["users"])


@router.get("/user/{email}/exists")
async def user_exists(
    email: str, _: LoggedInUser, users: Annotated[UserRepository, Depends(get_user_repository)]
) -> schemas.SuccessResponse[bool]:
    return schemas.success(await users.find_user_id(email) is not None)


@router.post("/guest/version")
async def new_guest_version(
    response: Response,
    session: CurrentWebSession,
    sessions: Sessions,
    session_repository: Annotated[WebSessionRepository, Depends(get_web_session_repository)],
    versions: Versions,
) -> schemas.SuccessResponse[schemas.Version]:
    if session is not None and session.user_id is not None:
        raise GuestsOnlyError
    if session is None:
        # The first thing that a new guest needs a session for
        session = await sessions.start_guest(response)
    version_id = str(uuid.uuid4())
    await versions.save_version(version_id, None)
    await session_repository.add_guest_version(session.id_hash, version_id)
    return schemas.success(await versions.get_version(version_id))
