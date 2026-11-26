"""A fake Auth0, for the tests of the login. It is an HTTP transport, so no call goes over the network.

It answers the two calls the API makes after Auth0 sends the browser back: the token (`POST /oauth/token`) and the user
(`GET /userinfo`). A test sets the email it gives, or makes either call fail.
"""

from dataclasses import dataclass, field
from urllib.parse import parse_qs

import httpx2

from app.clients.auth0_client import create_auth0_http_client
from app.config import Settings

DOMAIN = "auth0.example"
CLIENT_ID = "the-client"
CLIENT_SECRET = "the-secret"
CODE = "the-code"
TOKEN = "an.auth0.access.token"


@dataclass
class FakeAuth0:
    email: str | None = "sso.user@example.com"
    token_status: int = 200
    token_body: dict | None = None
    userinfo_status: int = 200
    connect_error: bool = False
    calls: list[httpx2.Request] = field(default_factory=list)

    def __post_init__(self):
        self.http = create_auth0_http_client(Settings(auth0_domain=DOMAIN), transport=httpx2.MockTransport(self.handle))

    def handle(self, request: httpx2.Request) -> httpx2.Response:
        self.calls.append(request)
        if self.connect_error:
            raise httpx2.ConnectError("refused", request=request)
        if request.method == "POST" and request.url.path == "/oauth/token":
            form = {k: v[0] for k, v in parse_qs(request.content.decode()).items()}
            if form.get("code") != CODE or form.get("client_secret") != CLIENT_SECRET:
                return httpx2.Response(403, json={"error": "invalid_grant"})
            body = self.token_body if self.token_body is not None else {"access_token": TOKEN, "token_type": "Bearer"}
            return httpx2.Response(self.token_status, json=body)
        if request.method == "GET" and request.url.path == "/userinfo":
            if request.headers.get("Authorization") != f"Bearer {TOKEN}":
                return httpx2.Response(401, json={"error": "invalid_token"})
            body = {"sub": "auth0|1"} if self.email is None else {"sub": "auth0|1", "email": self.email}
            return httpx2.Response(self.userinfo_status, json=body)
        return httpx2.Response(404)

    def form_of(self, request: httpx2.Request) -> dict[str, str]:
        return {k: v[0] for k, v in parse_qs(request.content.decode()).items()}
