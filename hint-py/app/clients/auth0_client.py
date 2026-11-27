"""Login with Auth0 (single sign-on): the OAuth 2 authorization code flow, with PKCE. The protocol is authlib's
(`AsyncOAuth2Client`); this file only says which Auth0 addresses and settings it uses.

1. `GET /oauth2` sends the browser to Auth0's `/authorize`, with a random `state` and a PKCE code challenge. The `state`
   and the code verifier go in a short-lived cookie (app/routers/login.py).
2. The user logs in at Auth0, which sends the browser back to `/callback/oauth2Client` with a `code` and the `state`.
3. The API swaps the code, and the code verifier, for an access token (`/oauth/token`), and asks Auth0 who the user is
   (`/userinfo`).

The access token is for ADR as well (the `audience` and the `access:adr` scope), so the API keeps it in the session
(encrypted) and calls ADR as the user with it.

PKCE means that a code is no use to someone who steals it on its way back (in a log, in the browser's history): only
the browser that started the login has the verifier.
"""

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Annotated
from urllib.parse import urlencode

import httpx2
import structlog
from authlib.common.security import generate_token
from authlib.integrations.base_client import OAuthError
from authlib.integrations.httpx_client import AsyncOAuth2Client
from fastapi import Depends, Request

from app.config import Settings, get_settings

log = structlog.get_logger()

TIMEOUT_SECONDS = 30
CALLBACK_PATH = "/callback/oauth2Client"


class Auth0Error(Exception):
    """Auth0 did not give a token or a user. The details are logged, never shown: they can have the code in them."""


@dataclass(frozen=True)
class LoginStart:
    """A login that this API has sent to Auth0: where to send the browser, and what the callback must match."""

    url: str
    state: str
    code_verifier: str


@dataclass(frozen=True)
class Auth0Token:
    access_token: str
    # When Auth0 says the token stops working, or None if it did not say
    expires_at: datetime | None


def create_auth0_oauth_client(
    settings: Settings, transport: httpx2.AsyncBaseTransport | None = None
) -> AsyncOAuth2Client:
    """The one client of the calls to Auth0, for the whole app. `transport` is for the fake Auth0 of the tests.

    authlib's client can also keep a user's token and add it to its requests. This API never lets it: the client is
    shared by every request, so each call is given the token it needs (`withhold_token=True`).
    """
    return AsyncOAuth2Client(
        client_id=settings.auth0_client_id,
        client_secret=settings.auth0_client_secret.get_secret_value(),
        # The secret goes in the body of the token request, as Kotlin (pac4j) sent it
        token_endpoint_auth_method="client_secret_post",  # noqa: S106 (the name of a method, not a secret)
        scope=settings.auth0_scope,
        redirect_uri=f"{settings.application_url}{CALLBACK_PATH}",
        code_challenge_method="S256",
        base_url=f"https://{settings.auth0_domain or 'auth0.invalid'}",
        timeout=TIMEOUT_SECONDS,
        transport=transport,
    )


class Auth0:
    def __init__(self, client: AsyncOAuth2Client, settings: Settings):
        self.client = client
        self.settings = settings

    def start_login(self, *, sign_up: bool = False) -> LoginStart:
        """Where the browser logs in (or, with `sign_up`, makes an account), with a new state and code verifier."""
        code_verifier = generate_token(48)
        extra = {"audience": self.settings.auth0_audience}
        if sign_up:
            extra["screen_hint"] = "signup"
        url, state = self.client.create_authorization_url(
            f"https://{self.settings.auth0_domain}/authorize", code_verifier=code_verifier, **extra
        )
        return LoginStart(url=url, state=state, code_verifier=code_verifier)

    def logout_url(self) -> str:
        """Ends the user's Auth0 session too, then Auth0 sends the browser to the login page."""
        params = {"client_id": self.settings.auth0_client_id, "returnTo": f"{self.settings.application_url}/login"}
        return f"https://{self.settings.auth0_domain}/v2/logout?{urlencode(params)}"

    async def access_token(self, code: str, code_verifier: str) -> Auth0Token:
        try:
            token = await self.client.fetch_token("/oauth/token", code=code, code_verifier=code_verifier)
        except OAuthError as e:
            # Only Auth0's error code (`invalid_grant`...), with no traceback: the description can quote the code
            log.error("Auth0 refused to give a token", error=e.error)  # noqa: TRY400
            raise Auth0Error from e
        except httpx2.HTTPError as e:
            log.exception("Auth0 did not give a token", error=type(e).__name__)
            raise Auth0Error from e
        access_token = token.get("access_token")
        if not isinstance(access_token, str) or not access_token:
            log.error("Auth0 gave no access token")
            raise Auth0Error
        # authlib works out `expires_at` (seconds since 1970) from Auth0's `expires_in`
        expires_at = token.get("expires_at")
        return Auth0Token(
            access_token=access_token,
            expires_at=datetime.fromtimestamp(expires_at, UTC) if isinstance(expires_at, int | float) else None,
        )

    async def email(self, access_token: str) -> str | None:
        """The email of the user, as Auth0 has it, or None if Auth0 has none."""
        try:
            r = await self.client.request(
                "GET", "/userinfo", withhold_token=True, headers={"Authorization": f"Bearer {access_token}"}
            )
        except httpx2.HTTPError as e:
            log.exception("Auth0 cannot be reached for the user", error=type(e).__name__)
            raise Auth0Error from e
        if not r.is_success:
            log.error("Auth0 did not say who the user is", status=r.status_code)
            raise Auth0Error
        try:
            body = r.json()
        except ValueError:
            body = None
        email = body.get("email") if isinstance(body, dict) else None
        return email if isinstance(email, str) else None


def get_auth0(request: Request, settings: Annotated[Settings, Depends(get_settings)]) -> Auth0:
    return Auth0(request.app.state.auth0_oauth, settings)


Auth0Client = Annotated[Auth0, Depends(get_auth0)]
