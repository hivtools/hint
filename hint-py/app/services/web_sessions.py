"""Who is using the app: the logins and guest visits, kept in Postgres (target design R6).

The browser holds a cookie with a random session id (`secrets.token_urlsafe(32)`). The `web_session` table holds only the
SHA-256 of it, so a copy of the table cannot be used to log in. A login always makes a new id, so an id that someone had
before the login (for example one they set in the browser of another person) is of no use after it.

How long a session lasts:

- A logged in user gets a cookie that stays when the browser closes. The session ends 7 days after its last use, and 30
  days after the login in any case.
- A guest gets a cookie that the browser forgets when it closes, and the session ends 24 hours after its last use.
- `expires_at` is moved on only when the last move is more than 5 minutes old, so most requests do not write. Only then
  does a logged in user get a new `Set-Cookie`.
- Every read checks `expires_at` and the 30 days, so a row that is still in the table lets nobody in after that.

A visitor with no session, or a session that has ended, is the guest user. Nothing is written for them until something
needs a row: a guest version (`POST /guest/version`), or the start of a login with Auth0 (it keeps the OAuth state).
"""

import hashlib
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends, Request, Response

from app.config import Settings, get_settings
from app.db.web_session_repository import WebSessionRepository, WebSessionRow, get_web_session_repository

COOKIE_NAME = "hint_session"
USER_IDLE = timedelta(days=7)
ABSOLUTE = timedelta(days=30)
GUEST_IDLE = timedelta(hours=24)
REFRESH_AFTER = timedelta(minutes=5)


def utc_now() -> datetime:
    """The time now. The tests replace it to move the clock."""
    return datetime.now(UTC)


def _hash(session_id: str) -> bytes:
    return hashlib.sha256(session_id.encode()).digest()


@dataclass(frozen=True)
class WebSession:
    """The session of a request, as the endpoints see it."""

    id_hash: bytes
    user_id: str | None
    access_token: str | None
    oauth_state: str | None
    redirect_to: str | None
    guest_version_ids: frozenset[str]

    @classmethod
    def from_row(cls, row: WebSessionRow) -> WebSession:
        return cls(
            id_hash=row.id_hash,
            user_id=row.user_id,
            access_token=row.access_token,
            oauth_state=row.oauth_state,
            redirect_to=row.redirect_to,
            guest_version_ids=row.guest_version_ids,
        )


class WebSessions:
    """Reads the session of a request, and starts and ends sessions. It sets the cookie on the response it is given."""

    def __init__(self, repository: WebSessionRepository, settings: Settings):
        self.repository = repository
        self.settings = settings

    async def current(self, request: Request, response: Response) -> WebSession | None:
        """The live session of the request, or None (no cookie, an unknown id, or a session that has ended)."""
        session_id = request.cookies.get(COOKIE_NAME)
        if not session_id:
            return None
        now = utc_now()
        row = await self.repository.get_live(_hash(session_id), now, created_after=now - ABSOLUTE)
        if row is None:
            return None
        idle = USER_IDLE if row.user_id else GUEST_IDLE
        if row.expires_at - idle < now - REFRESH_AFTER:
            await self.repository.set_expires_at(row.id_hash, now + idle)
            if row.user_id:
                self._set_cookie(response, session_id, persistent=True)
        return WebSession.from_row(row)

    async def start_guest(self, response: Response) -> WebSession:
        """A new session for a visitor who has not logged in."""
        return await self._start(response, user_id=None, access_token=None)

    async def log_in(
        self, response: Response, old: WebSession | None, user_id: str, access_token: str | None
    ) -> WebSession:
        """A new session for `user_id`, with a new id. The session they had before (as a guest, or as someone else) ends."""
        if old is not None:
            await self.repository.delete(old.id_hash)
        return await self._start(response, user_id=user_id, access_token=access_token)

    async def log_out(self, response: Response, session: WebSession | None) -> None:
        if session is not None:
            await self.repository.delete(session.id_hash)
        response.delete_cookie(COOKIE_NAME, path="/", secure=self._secure, httponly=True, samesite="lax")

    async def _start(self, response: Response, user_id: str | None, access_token: str | None) -> WebSession:
        session_id = secrets.token_urlsafe(32)
        now = utc_now()
        id_hash = _hash(session_id)
        await self.repository.create(
            id_hash,
            user_id=user_id,
            access_token=access_token,
            created_at=now,
            expires_at=now + (USER_IDLE if user_id else GUEST_IDLE),
        )
        self._set_cookie(response, session_id, persistent=user_id is not None)
        return WebSession(
            id_hash=id_hash,
            user_id=user_id,
            access_token=access_token,
            oauth_state=None,
            redirect_to=None,
            guest_version_ids=frozenset(),
        )

    def _set_cookie(self, response: Response, session_id: str, *, persistent: bool) -> None:
        # HttpOnly: no script can read it. SameSite=Lax: the browser still sends it on the redirect back from Auth0.
        # Secure when the app is on https (always, deployed); the dev stack is on http.
        response.set_cookie(
            COOKIE_NAME,
            session_id,
            max_age=int(USER_IDLE.total_seconds()) if persistent else None,
            path="/",
            secure=self._secure,
            httponly=True,
            samesite="lax",
        )

    @property
    def _secure(self) -> bool:
        return self.settings.application_url.startswith("https://")


def get_web_sessions(
    repository: Annotated[WebSessionRepository, Depends(get_web_session_repository)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> WebSessions:
    return WebSessions(repository, settings)


Sessions = Annotated[WebSessions, Depends(get_web_sessions)]


async def current_web_session(request: Request, response: Response, sessions: Sessions) -> WebSession | None:
    """The session of the request (see `WebSessions.current`). FastAPI runs it once for each request, however many
    dependencies use it."""
    return await sessions.current(request, response)


CurrentWebSession = Annotated[WebSession | None, Depends(current_web_session)]
