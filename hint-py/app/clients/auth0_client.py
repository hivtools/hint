"""Login with Auth0 (single sign-on), the OAuth 2 authorization code flow. Kotlin did this with pac4j.

1. `GET /oauth2` sends the browser to Auth0's `/authorize`, with a random `state` that the session keeps.
2. The user logs in at Auth0, which sends the browser back to `/callback/oauth2Client` with a `code` and the `state`.
3. The API swaps the code for an access token (`/oauth/token`), and asks Auth0 who the user is (`/userinfo`).

The access token is for ADR as well (the `audience` and the `access:adr` scope), so the API keeps it in the session and
calls ADR as the user with it.
"""

from typing import Annotated
from urllib.parse import urlencode

import httpx2
import structlog
from fastapi import Depends, Request

from app.config import Settings, get_settings

log = structlog.get_logger()

TIMEOUT_SECONDS = 30
CALLBACK_PATH = "/callback/oauth2Client"


class Auth0Error(Exception):
    """Auth0 did not give a token or a user. The details are logged, never shown: they can have the code in them."""


def create_auth0_http_client(
    settings: Settings, transport: httpx2.AsyncBaseTransport | None = None
) -> httpx2.AsyncClient:
    """The HTTP client of the calls to Auth0. `transport` is for the fake Auth0 of the tests."""
    return httpx2.AsyncClient(
        base_url=f"https://{settings.auth0_domain or 'auth0.invalid'}", timeout=TIMEOUT_SECONDS, transport=transport
    )


class Auth0:
    def __init__(self, http: httpx2.AsyncClient, settings: Settings):
        self.http = http
        self.settings = settings

    @property
    def _redirect_uri(self) -> str:
        return f"{self.settings.application_url}{CALLBACK_PATH}"

    def authorize_url(self, state: str, *, sign_up: bool = False) -> str:
        """Where the browser logs in (or, with `sign_up`, makes an account)."""
        params = {
            "response_type": "code",
            "client_id": self.settings.auth0_client_id,
            "state": state,
            "scope": self.settings.auth0_scope,
            "audience": self.settings.auth0_audience,
            "redirect_uri": self._redirect_uri,
        }
        if sign_up:
            params["screen_hint"] = "signup"
        return f"https://{self.settings.auth0_domain}/authorize?{urlencode(params)}"

    def logout_url(self) -> str:
        """Ends the user's Auth0 session too, then Auth0 sends the browser to the login page."""
        params = {"client_id": self.settings.auth0_client_id, "returnTo": f"{self.settings.application_url}/login"}
        return f"https://{self.settings.auth0_domain}/v2/logout?{urlencode(params)}"

    async def access_token(self, code: str) -> str:
        try:
            r = await self.http.post(
                "/oauth/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": self._redirect_uri,
                    "client_id": self.settings.auth0_client_id,
                    "client_secret": self.settings.auth0_client_secret.get_secret_value(),
                },
            )
        except httpx2.HTTPError as e:
            log.exception("Auth0 cannot be reached for a token", error=type(e).__name__)
            raise Auth0Error from e
        token = _json(r).get("access_token") if r.is_success else None
        if not isinstance(token, str) or not token:
            log.error("Auth0 gave no access token", status=r.status_code)
            raise Auth0Error
        return token

    async def email(self, access_token: str) -> str | None:
        """The email of the user, as Auth0 has it, or None if Auth0 has none."""
        try:
            r = await self.http.get("/userinfo", headers={"Authorization": f"Bearer {access_token}"})
        except httpx2.HTTPError as e:
            log.exception("Auth0 cannot be reached for the user", error=type(e).__name__)
            raise Auth0Error from e
        if not r.is_success:
            log.error("Auth0 did not say who the user is", status=r.status_code)
            raise Auth0Error
        email = _json(r).get("email")
        return email if isinstance(email, str) else None


def _json(r: httpx2.Response) -> dict:
    try:
        body = r.json()
    except ValueError:
        return {}
    return body if isinstance(body, dict) else {}


def get_auth0(request: Request, settings: Annotated[Settings, Depends(get_settings)]) -> Auth0:
    return Auth0(request.app.state.auth0_http, settings)


Auth0Client = Annotated[Auth0, Depends(get_auth0)]
