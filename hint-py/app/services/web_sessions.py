"""Who is using the app: the logins and guest visits, kept in Postgres (target design R6). docs/login-and-sessions.md
has diagrams of all of it.

The browser holds a cookie with a random session id (`secrets.token_urlsafe(32)`). The `web_session` table holds only the
SHA-256 of it, so a copy of the table cannot be used to log in. A login always makes a new id, so an id that someone had
before the login (for example one they set in the browser of another person) is of no use after it.

How long a session lasts:

- A logged in user gets a cookie that stays when the browser closes. The session ends 7 days after its last use
  (`USER_IDLE_TIMEOUT`), and 30 days after the login in any case (`MAX_SESSION_AGE`).
- A user who logged in with Auth0 has an access token, with which ADR is called as them. The session ends when Auth0
  says the token stops working (`expires_in`, 24 hours in our tenant), if that is sooner: they log in again, and get a
  new token. Auth0 usually still has its own session, so that is one click.
- A guest gets a cookie that the browser forgets when it closes, and the session ends 24 hours after its last use
  (`GUEST_IDLE_TIMEOUT`).
- `expires_at` is moved on only when the last move is more than 5 minutes old (`EXPIRY_REFRESH_INTERVAL`), so most
  requests do not write. Only then does a logged in user get a new `Set-Cookie`.
- Every read checks all of these, so a row that is still in the table lets nobody in after its end.

The access token is kept encrypted (app/services/token_encryption.py). A session whose token no key decrypts (the key
was removed) has ended too.

A visitor with no session, or a session that has ended, is the guest user. Nothing is written for them until they need a
row: a guest version (`POST /guest/version`).
"""

import hashlib
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Annotated

import structlog
from fastapi import Depends, Request, Response

from app import clock
from app.clients.auth0_client import Auth0Token
from app.config import Settings, get_settings
from app.db.web_session_repository import WebSessionRepository, WebSessionRow, get_web_session_repository
from app.services.token_encryption import TokenEncryption

log = structlog.get_logger()

COOKIE_NAME = "hint_session"
USER_IDLE_TIMEOUT = timedelta(days=7)
GUEST_IDLE_TIMEOUT = timedelta(hours=24)
MAX_SESSION_AGE = timedelta(days=30)
EXPIRY_REFRESH_INTERVAL = timedelta(minutes=5)


def _hash(session_id: str) -> bytes:
    return hashlib.sha256(session_id.encode()).digest()


@dataclass(frozen=True)
class WebSession:
    """The session of a request, as the endpoints see it."""

    id_hash: bytes
    user_id: str | None
    # The Auth0 access token, decrypted. None for a guest and a dev login
    access_token: str | None
    guest_version_ids: frozenset[str]

    @property
    def logged_in_with_auth0(self) -> bool:
        """A logout then ends their Auth0 session too."""
        return self.access_token is not None


class WebSessions:
    """Reads the session of a request, and starts and ends sessions. It sets the cookie on the response it is given."""

    def __init__(self, session_repository: WebSessionRepository, settings: Settings):
        self.session_repository = session_repository
        self.settings = settings
        self._encryption = (
            TokenEncryption(settings.session_encryption_keys) if settings.session_encryption_keys else None
        )

    async def current(self, request: Request, response: Response) -> WebSession | None:
        """The live session of the request, or None (no cookie, an unknown id, or a session that has ended)."""
        session_id = request.cookies.get(COOKIE_NAME)
        if not session_id:
            return None
        now = clock.utc_now()
        row = await self.session_repository.get_session(_hash(session_id))
        # Every rule about how long a session lasts is here. A row that has ended stays in the table until the clean-up,
        # and lets nobody in
        if row is None or row.expires_at <= now or _latest_end(row) <= now:
            return None
        session = self._from_row(row)
        if session is None:
            return None
        idle_timeout = USER_IDLE_TIMEOUT if row.user_id else GUEST_IDLE_TIMEOUT
        if row.expires_at - idle_timeout < now - EXPIRY_REFRESH_INTERVAL:
            await self.session_repository.extend_session(row.id_hash, now + idle_timeout)
            if row.user_id:
                self._set_cookie(response, session_id, persistent=True)
        return session

    async def start_guest(self, response: Response) -> WebSession:
        """A new session for a visitor who has not logged in."""
        return await self._start(response, user_id=None, token=None)

    async def log_in(
        self, response: Response, old: WebSession | None, user_id: str, token: Auth0Token | None
    ) -> WebSession:
        """A new session for `user_id`, with a new id. The session they had before (as a guest, or as someone else) ends:
        its row is deleted, with the guest versions it listed."""
        if old is not None:
            await self.session_repository.delete_session(old.id_hash)
        return await self._start(response, user_id=user_id, token=token)

    async def log_out(self, response: Response, session: WebSession | None) -> None:
        if session is not None:
            await self.session_repository.delete_session(session.id_hash)
        response.delete_cookie(COOKIE_NAME, path="/", secure=self.secure_cookies, httponly=True, samesite="lax")

    async def _start(self, response: Response, user_id: str | None, token: Auth0Token | None) -> WebSession:
        session_id = secrets.token_urlsafe(32)
        now = clock.utc_now()
        id_hash = _hash(session_id)
        await self.session_repository.create_session(
            id_hash,
            user_id=user_id,
            access_token=self._encrypt(token.access_token) if token else None,
            access_token_expires_at=token.expires_at if token else None,
            created_at=now,
            expires_at=now + (USER_IDLE_TIMEOUT if user_id else GUEST_IDLE_TIMEOUT),
        )
        self._set_cookie(response, session_id, persistent=user_id is not None)
        return WebSession(
            id_hash=id_hash,
            user_id=user_id,
            access_token=token.access_token if token else None,
            guest_version_ids=frozenset(),
        )

    def _encrypt(self, token: str) -> str:
        if self._encryption is None:
            # The settings refuse Auth0 without keys, so only a misconfigured test gets here
            message = "HINT_SESSION_ENCRYPTION_KEYS is not set, so an access token cannot be kept"
            raise RuntimeError(message)
        return self._encryption.encrypt(token)

    def _from_row(self, row: WebSessionRow) -> WebSession | None:
        access_token = None
        if row.access_token is not None:
            access_token = self._encryption.decrypt(row.access_token) if self._encryption else None
            if access_token is None:
                # The key that encrypted it has been removed. The user logs in again to get a new token
                log.warning("No key decrypts the access token of a session, so it has ended")
                return None
        return WebSession(
            id_hash=row.id_hash,
            user_id=row.user_id,
            access_token=access_token,
            guest_version_ids=row.guest_version_ids,
        )

    def _set_cookie(self, response: Response, session_id: str, *, persistent: bool) -> None:
        # HttpOnly: no script can read it. SameSite=Lax: the browser still sends it on the redirect back from Auth0.
        # Secure when the app is on https (always, deployed); the dev stack is on http.
        response.set_cookie(
            COOKIE_NAME,
            session_id,
            max_age=int(USER_IDLE_TIMEOUT.total_seconds()) if persistent else None,
            path="/",
            secure=self.secure_cookies,
            httponly=True,
            samesite="lax",
        )

    @property
    def secure_cookies(self) -> bool:
        return self.settings.application_url.startswith("https://")


def _latest_end(row: WebSessionRow) -> datetime:
    """When the session ends, however often it is used: 30 days after the login, or when Auth0 says the access token
    stops working, if that is sooner."""
    end = row.created_at + MAX_SESSION_AGE
    if row.access_token_expires_at is not None:
        end = min(end, row.access_token_expires_at)
    return end


def get_web_sessions(
    session_repository: Annotated[WebSessionRepository, Depends(get_web_session_repository)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> WebSessions:
    return WebSessions(session_repository, settings)


Sessions = Annotated[WebSessions, Depends(get_web_sessions)]


async def current_web_session(request: Request, response: Response, sessions: Sessions) -> WebSession | None:
    """The session of the request (see `WebSessions.current`). FastAPI runs it once for each request, however many
    dependencies use it."""
    return await sessions.current(request, response)


CurrentWebSession = Annotated[WebSession | None, Depends(current_web_session)]
