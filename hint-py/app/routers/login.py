"""Logging in and out. Kotlin did this with pac4j. See D22 in docs/porting-checklist.md for what is different.

- `GET /login`: the login page. Deployed, it has the Auth0 (single sign-on) button. In development it has one button
  for each user in `HINT_DEV_USERS` instead (`POST /dev-login`). There is no password login (D11).
- `GET /oauth2` and `GET /register` start a login (or sign up) with Auth0, and `GET /callback/oauth2Client` is where
  Auth0 sends the browser back (app/clients/auth0_client.py).
- `GET /logout` ends the session, and the user's Auth0 session too if they logged in with it.

A login always starts a new session with a new id (app/services/web_sessions.py), and the guest session the browser had
before ends.
"""

import secrets
from pathlib import Path
from typing import Annotated
from urllib.parse import urlencode

import structlog
from fastapi import APIRouter, Depends, Form, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from app.clients.auth0_client import Auth0Client
from app.config import Settings, get_settings
from app.db.user_repository import UserRepository, get_user_repository
from app.db.web_session_repository import WebSessionRepository, get_web_session_repository
from app.errors import (
    InvalidEmailError,
    LoginCodeMissingError,
    LoginStateMismatchError,
    LoginStateMissingError,
)
from app.services.web_sessions import CurrentWebSession, Sessions

log = structlog.get_logger()

router = APIRouter(tags=["login"], include_in_schema=False)

templates = Jinja2Templates(directory=Path(__file__).parent.parent / "templates")

SettingsDep = Annotated[Settings, Depends(get_settings)]
Users = Annotated[UserRepository, Depends(get_user_repository)]
SessionRows = Annotated[WebSessionRepository, Depends(get_web_session_repository)]

SESSION_EXPIRED = "Your session expired. Please log in again"


def local_path(path: str | None) -> str:
    """`path` if it is a page of this app, else "/". Where to go after a login comes from the query string, so it must
    not be able to send the user to another site (an open redirect)."""
    if path and path.startswith("/") and not path.startswith("//") and "\\" not in path:
        return path
    return "/"


@router.get("/login", response_class=HTMLResponse)
async def login_page(
    request: Request,
    settings: SettingsDep,
    error: str | None = None,
    message: str | None = None,
    redirectTo: str | None = None,
) -> HTMLResponse:
    continue_to = local_path(redirectTo)
    # The Vue app sends a user whose session has ended here with error=SessionExpired, and the message to show
    shown_error = (message or SESSION_EXPIRED) if error == "SessionExpired" else None
    sso_url = "/oauth2" if continue_to == "/" else f"/oauth2?{urlencode({'redirectTo': continue_to})}"
    return templates.TemplateResponse(
        request,
        "login.html",
        {
            "app_title": settings.application_title,
            "sso": settings.auth0_configured,
            "sso_url": sso_url,
            "dev_users": settings.dev_users,
            "error": shown_error,
            "continue_to": continue_to,
        },
        headers={"Cache-Control": "no-store"},
    )


async def _start_auth0(
    auth0: Auth0Client,
    sessions: Sessions,
    rows: SessionRows,
    session: CurrentWebSession,
    redirect_to: str | None,
    *,
    sign_up: bool,
) -> Response:
    # The state goes in the session of this browser, which needs one, even as a guest. A new start replaces the state of
    # an earlier one, so only the latest login can come back.
    response = RedirectResponse("/", status_code=303)
    if session is None:
        session = await sessions.start_guest(response)
    state = secrets.token_urlsafe(32)
    await rows.set_login_target(session.id_hash, state, local_path(redirect_to))
    response.headers["location"] = auth0.authorize_url(state, sign_up=sign_up)
    return response


@router.get("/oauth2")
async def oauth2(
    auth0: Auth0Client,
    sessions: Sessions,
    rows: SessionRows,
    session: CurrentWebSession,
    redirectTo: str | None = None,
) -> Response:
    return await _start_auth0(auth0, sessions, rows, session, redirectTo, sign_up=False)


@router.get("/register")
async def register(auth0: Auth0Client, sessions: Sessions, rows: SessionRows, session: CurrentWebSession) -> Response:
    return await _start_auth0(auth0, sessions, rows, session, None, sign_up=True)


@router.get("/callback/oauth2Client")
async def auth0_callback(
    auth0: Auth0Client,
    sessions: Sessions,
    users: Users,
    session: CurrentWebSession,
    state: str | None = None,
    code: str | None = None,
) -> Response:
    if not state:
        raise LoginStateMissingError
    if session is None or session.oauth_state is None or not secrets.compare_digest(session.oauth_state, state):
        raise LoginStateMismatchError
    if not code:
        raise LoginCodeMissingError
    # Auth0Error, if Auth0 gives no token or no user, is an unexpected error (500), as in Kotlin
    access_token = await auth0.access_token(code)
    email = await auth0.email(access_token)
    if not email or "@" not in email:
        raise InvalidEmailError
    user_id = await users.find_or_add_user(email)
    response = RedirectResponse(local_path(session.redirect_to), status_code=302)
    await sessions.log_in(response, session, user_id, access_token)
    log.info("Logged in with Auth0")
    return response


@router.post("/dev-login")
async def dev_login(
    settings: SettingsDep,
    sessions: Sessions,
    users: Users,
    session: CurrentWebSession,
    user: Annotated[str, Form()],
    redirectTo: Annotated[str | None, Form()] = None,
) -> Response:
    """Development only: log in as one of `HINT_DEV_USERS`, with no password. It makes the user if they do not exist, as
    a first login with Auth0 does. Without HINT_DEV_USERS (as deployed) there is no such endpoint."""
    if user not in settings.dev_users:
        if not settings.dev_users:
            return Response(status_code=404)
        raise InvalidEmailError
    user_id = await users.find_or_add_user(user)
    response = RedirectResponse(local_path(redirectTo), status_code=303)
    await sessions.log_in(response, session, user_id, access_token=None)
    return response


@router.get("/logout")
async def logout(settings: SettingsDep, sessions: Sessions, session: CurrentWebSession, auth0: Auth0Client) -> Response:
    # A user who logged in with Auth0 is logged out of Auth0 too (Kotlin: pac4j's central logout), or Auth0 would log
    # them straight back in. Auth0 then sends the browser to the login page.
    with_auth0 = session is not None and session.access_token is not None and settings.auth0_configured
    response = RedirectResponse(auth0.logout_url() if with_auth0 else "/login", status_code=302)
    await sessions.log_out(response, session)
    return response
