"""Who is making the request.

Authentication still lives in the Kotlin app. The nginx proxy in front of both apps asks Kotlin who the user is and
passes the answer on in headers (see proxy/snippets/python.conf), so this API only ever reads headers. When login and
sessions move to Python, only `current_user` needs to change.
"""

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException

GUEST_USER = "guest"


@dataclass(frozen=True)
class User:
    id: str

    @property
    def is_guest(self) -> bool:
        return self.id == GUEST_USER


def current_user(x_hint_user: Annotated[str | None, Header()] = None) -> User:
    if not x_hint_user:
        # Only happens if the API is reached without going through the proxy
        raise HTTPException(status_code=401, detail="Missing identity header")
    return User(id=x_hint_user)


def requested_version_id(x_version_id: Annotated[str | None, Header()] = None) -> str | None:
    """The project version the browser tab is working on (the X-Version-Id header, sent by the Vue app on every request).

    This is not part of the identity: the tab sends it, not the proxy. It is not checked yet. An endpoint that works on
    a version must first check that the user may use it (a project of theirs, or for a guest a version the server gave
    them), and answer 403 with the error code INVALID_VERSION if not, as the Kotlin app does.
    """
    return x_version_id or None


def logged_in_user(user: Annotated[User, Depends(current_user)]) -> User:
    """For endpoints that guests may not use (Kotlin: SecurePaths)."""
    if user.is_guest:
        raise HTTPException(status_code=401, detail="Login required")
    return user
