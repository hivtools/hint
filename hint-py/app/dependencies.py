"""Who is making the request.

Authentication still lives in the Kotlin app. The nginx proxy in front of both apps asks Kotlin who the user is and
passes the answer on in headers (see proxy/snippets/python.conf), so this API only ever reads headers. When login and
sessions move to Python, only `current_user` needs to change.

The project version a request works on is a separate matter: the browser tab sends it, and `current_version_id` checks
that the user may use it.
"""

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException

from app.db.version_repository import VersionRepository, get_version_repository
from app.errors import InvalidVersionError

GUEST_USER = "guest"


@dataclass(frozen=True)
class User:
    id: str
    # For a guest: the versions that the server has given to them. A guest has no projects, so this is the only record
    # of which versions are theirs. It is empty for everyone else.
    guest_version_ids: frozenset[str] = frozenset()

    @property
    def is_guest(self) -> bool:
        return self.id == GUEST_USER


def current_user(
    x_hint_user: Annotated[str | None, Header()] = None,
    x_hint_guest_versions: Annotated[str | None, Header()] = None,
) -> User:
    if not x_hint_user:
        # Only happens if the API is reached without going through the proxy
        raise HTTPException(status_code=401, detail="Missing identity header")
    user = User(id=x_hint_user)
    if not user.is_guest:
        return user
    # A comma separated list, kept in the Kotlin session (see `Session.addGuestVersionId`)
    ids = frozenset(v.strip() for v in (x_hint_guest_versions or "").split(",") if v.strip())
    return User(id=x_hint_user, guest_version_ids=ids)


def requested_version_id(x_version_id: Annotated[str | None, Header()] = None) -> str | None:
    """The version id in the X-Version-Id header, exactly as the browser sent it. It is not checked, so it may be missing,
    or be a version that does not exist or belongs to someone else.

    Only use this where such a version is not an error. `GET /project/current` does: it checks the version itself and
    answers with no project if it is not usable. An endpoint that works on a version should use `current_version_id`,
    which checks that the user may use it.
    """
    return x_version_id or None


async def usable_version_id(user: User, version_id: str | None, versions: VersionRepository) -> str:
    """The version id, if this user may use that version. Anything else, including no version id at all, is a 403 with
    the error code INVALID_VERSION, and the Vue app then clears the tab's state and starts again from the Projects page.

    A logged in user may use a version of one of their projects. A guest has no projects, so they may use the versions
    the server gave to them (`POST /guest/version`). This is checked on every request: a version id is hard to guess,
    but that is not what keeps users out of each other's files.
    """
    if not version_id:
        raise InvalidVersionError()
    if user.is_guest:
        allowed = version_id in user.guest_version_ids
    else:
        allowed = await versions.version_exists(version_id, user.id)
    if not allowed:
        raise InvalidVersionError()
    return version_id


async def current_version_id(
    user: Annotated[User, Depends(current_user)],
    version_id: Annotated[str | None, Depends(requested_version_id)],
    versions: Annotated[VersionRepository, Depends(get_version_repository)],
) -> str:
    """The project version this request works on, after checking that the user may use it (see `usable_version_id`)."""
    return await usable_version_id(user, version_id, versions)


def logged_in_user(user: Annotated[User, Depends(current_user)]) -> User:
    """For endpoints that guests may not use (Kotlin: SecurePaths)."""
    if user.is_guest:
        raise HTTPException(status_code=401, detail="Login required")
    return user
