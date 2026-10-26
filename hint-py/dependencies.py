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
    version_id: str

    @property
    def is_guest(self) -> bool:
        return self.id == GUEST_USER


def current_user(
    x_hint_user: Annotated[str | None, Header()] = None,
    x_hint_version_id: Annotated[str | None, Header()] = None,
) -> User:
    if not x_hint_user or not x_hint_version_id:
        # Only happens if the API is reached without going through the proxy
        raise HTTPException(status_code=401, detail="Missing identity headers")
    return User(id=x_hint_user, version_id=x_hint_version_id)


def logged_in_user(user: Annotated[User, Depends(current_user)]) -> User:
    """For endpoints that guests may not use (Kotlin: SecurePaths)."""
    if user.is_guest:
        raise HTTPException(status_code=401, detail="Login required")
    return user
