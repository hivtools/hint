"""Logging in and out. docs/login-and-sessions.md has diagrams of the flows.

- `GET /login`: the login page, a static file (app/pages/login.html). It asks `GET /login/options` what to show:
  deployed, the Auth0 (single sign-on) button; in development, one button for each user in `HINT_DEV_USERS` instead
  (`POST /dev-login`). There is no password login (D11).
- `GET /oauth2` and `GET /register` start a login (or sign up) with Auth0, and `GET /callback/oauth2Client` is where
  Auth0 sends the browser back (app/clients/auth0_client.py).
- `GET /logout` ends the session, and the user's Auth0 session too if they logged in with it.

A login always starts a new session with a new id (app/services/web_sessions.py), and the session the browser had before
ends. After a login the browser always goes to the app's start page, `/`.

While a login with Auth0 is under way, the `state` and the PKCE code verifier are in a cookie of their own (`LOGIN_COOKIE`),
not in the session: nothing is written to the database for a login that is never finished. The callback must come back
with the same `state` as that cookie. This stops "login CSRF": someone who logs in to Auth0 as themselves, keeps the
callback address with their `code`, and gets someone else's browser to open it. Without the check, that browser would be
logged in as them, and its user would put their data in someone else's account.
"""

import secrets
from pathlib import Path
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, Form, Request, Response
from fastapi.responses import FileResponse, RedirectResponse

from app import schemas
from app.clients.auth0_client import Auth0Client
from app.config import Settings, get_settings
from app.db.user_repository import UserRepository, get_user_repository
from app.errors import (
    InvalidEmailError,
    LoginCodeMissingError,
    LoginStateMismatchError,
    LoginStateMissingError,
)
from app.services.web_sessions import CurrentWebSession, Sessions

log = structlog.get_logger()

router = APIRouter(tags=["login"], include_in_schema=False)

SettingsDep = Annotated[Settings, Depends(get_settings)]
Users = Annotated[UserRepository, Depends(get_user_repository)]

LOGIN_PAGE = Path(__file__).parent.parent / "pages" / "login.html"
# Long enough to log in at Auth0, or to make an account there
LOGIN_COOKIE_MAX_AGE_SECONDS = 15 * 60


def login_cookie_name(sessions: Sessions) -> str:
    """On https, the `__Host-` prefix makes the browser refuse the cookie unless this site set it, with `Secure`, for
    `/` and no `Domain`: another site under the same domain cannot set it. The dev stack is on http, which cannot have
    the prefix."""
    return "__Host-hint_login" if sessions.secure_cookies else "hint_login"


@router.get("/login")
async def login_page() -> FileResponse:
    # The page is the same for everyone: what changes (the buttons, an error) it gets from GET /login/options and from
    # its own address. `no-cache`, as for the page of the app: a deploy that changes it is seen at once.
    return FileResponse(LOGIN_PAGE, media_type="text/html", headers={"Cache-Control": "no-cache"})


@router.get("/login/options")
async def login_options(settings: SettingsDep) -> schemas.SuccessResponse[schemas.LoginOptions]:
    return schemas.success(
        schemas.LoginOptions(
            title=settings.application_title, sso=settings.auth0_configured, dev_users=settings.dev_users
        )
    )


def _start_auth0(auth0: Auth0Client, sessions: Sessions, settings: Settings, *, sign_up: bool) -> Response:
    if not settings.auth0_configured:
        # The dev stack: there is no Auth0 to send the browser to
        return Response(status_code=404)
    start = auth0.start_login(sign_up=sign_up)
    response = RedirectResponse(start.url, status_code=303)
    # A new login replaces the cookie of an earlier one, so only the latest login can come back
    response.set_cookie(
        login_cookie_name(sessions),
        f"{start.state}.{start.code_verifier}",
        max_age=LOGIN_COOKIE_MAX_AGE_SECONDS,
        path="/",
        secure=sessions.secure_cookies,
        httponly=True,
        # Lax: the browser sends it when Auth0 sends it back here (a top-level GET from another site)
        samesite="lax",
    )
    return response


@router.get("/oauth2")
async def oauth2(auth0: Auth0Client, sessions: Sessions, settings: SettingsDep) -> Response:
    return _start_auth0(auth0, sessions, settings, sign_up=False)


@router.get("/register")
async def register(auth0: Auth0Client, sessions: Sessions, settings: SettingsDep) -> Response:
    return _start_auth0(auth0, sessions, settings, sign_up=True)


@router.get("/callback/oauth2Client")
async def auth0_callback(
    request: Request,
    auth0: Auth0Client,
    sessions: Sessions,
    users: Users,
    session: CurrentWebSession,
    state: str | None = None,
    code: str | None = None,
) -> Response:
    if not state:
        raise LoginStateMissingError
    # The state and the code verifier that GET /oauth2 put in this browser. authlib's tokens have no "."
    started_state, _, code_verifier = request.cookies.get(login_cookie_name(sessions), "").partition(".")
    if not started_state or not code_verifier or not secrets.compare_digest(started_state, state):
        raise LoginStateMismatchError
    if not code:
        raise LoginCodeMissingError
    # Auth0Error, if Auth0 gives no token or no user, is an unexpected error (500): the user can only try again
    token = await auth0.get_access_token(code, code_verifier)
    email = await auth0.get_email(token.access_token)
    if not email or "@" not in email:
        raise InvalidEmailError
    user_id = await users.find_or_add_user(email)
    response = RedirectResponse("/", status_code=302)
    await sessions.log_in(response, session, user_id, token)
    response.delete_cookie(login_cookie_name(sessions), path="/", secure=sessions.secure_cookies, httponly=True)
    log.info("Logged in with Auth0")
    return response


@router.post("/dev-login")
async def dev_login(
    settings: SettingsDep, sessions: Sessions, users: Users, session: CurrentWebSession, user: Annotated[str, Form()]
) -> Response:
    """Development only: log in as one of `HINT_DEV_USERS`, with no password. It makes the user if they do not exist, as
    a first login with Auth0 does. Without HINT_DEV_USERS (as deployed) there is no such endpoint."""
    if user not in settings.dev_users:
        if not settings.dev_users:
            return Response(status_code=404)
        raise InvalidEmailError
    user_id = await users.find_or_add_user(user)
    response = RedirectResponse("/", status_code=303)
    await sessions.log_in(response, session, user_id, token=None)
    return response


@router.get("/logout")
async def logout(settings: SettingsDep, sessions: Sessions, session: CurrentWebSession, auth0: Auth0Client) -> Response:
    # A user who logged in with Auth0 is logged out of Auth0 too or Auth0 would log
    # them straight back in. Auth0 then sends the browser to the login page.
    with_auth0 = session is not None and session.logged_in_with_auth0 and settings.auth0_configured
    response = RedirectResponse(auth0.get_logout_url() if with_auth0 else "/login", status_code=302)
    await sessions.log_out(response, session)
    return response
