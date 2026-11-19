"""A fake GitHub API, for the tests of the GitHub client and of the endpoints that check a GitHub token.

It is an HTTP transport, so no call goes over the network. It records each call. It knows a few tokens and the members
of one team, and answers as the real GitHub does: 401 for a token it does not know, and 404 for a user who is not in
the team. A test can make a call fail, or make the connection fail.

`tests/api/test_github_live.py` calls the real GitHub (only if HINT_GITHUB_TEST_TOKEN is set), to show that it still
answers in this way.
"""

import re
from collections.abc import Callable
from dataclasses import dataclass, field
from urllib.parse import unquote

import httpx2
import pytest

from app.clients.github_client import GITHUB_HEADERS
from tests.support import GITHUB_OTHER_TOKEN, GITHUB_TOKEN

ORG = "hivtools"
TEAM = "naomi-debug"
MEMBER = "a-developer"
OUTSIDER = "someone-else"
INVITED = "invited-developer"
# A token of a user who is invited to the team, and has not accepted yet
INVITED_TOKEN = "ghp_a-token-of-an-invited-user"

_MEMBERSHIP = re.compile(r"/orgs/([^/]+)/teams/([^/]+)/memberships/([^/]+)")


def github_error(status: int, message: str) -> httpx2.Response:
    return httpx2.Response(status, json={"message": message, "documentation_url": "https://docs.github.com/rest"})


@dataclass
class FakeGitHub:
    calls: list[httpx2.Request] = field(default_factory=list)
    # The user of each token
    users: dict[str, str] = field(
        default_factory=lambda: {GITHUB_TOKEN: MEMBER, GITHUB_OTHER_TOKEN: OUTSIDER, INVITED_TOKEN: INVITED}
    )
    # The state of each user in the team ORG/TEAM. A user who is not here is not in the team.
    team: dict[str, str] = field(default_factory=lambda: {MEMBER: "active", INVITED: "pending"})
    # A call ("user" or "membership") that gives a different answer from the normal one
    failures: dict[str, Callable[[httpx2.Request], httpx2.Response]] = field(default_factory=dict)
    http: httpx2.AsyncClient = field(init=False)

    def __post_init__(self):
        # The same headers as the real client has, for a `github_api_url` of https://github.example
        self.http = httpx2.AsyncClient(
            transport=httpx2.MockTransport(self._handler), base_url="https://github.example", headers=GITHUB_HEADERS
        )

    def fail(self, call: str, response: httpx2.Response):
        self.failures[call] = lambda request: response

    def fail_to_connect(self, call: str, error: Exception):
        def raise_it(request: httpx2.Request) -> httpx2.Response:
            raise error

        self.failures[call] = raise_it

    def paths(self) -> list[str]:
        return [call.url.path for call in self.calls]

    def _handler(self, request: httpx2.Request) -> httpx2.Response:
        self.calls.append(request)
        # The raw path, so that a name with a "/" in it is still one part of the path
        membership = _MEMBERSHIP.fullmatch(request.url.raw_path.decode())
        if request.url.path == "/user":
            call = "user"
        elif membership:
            call = "membership"
        else:
            pytest.fail(f"The fake GitHub does not know the path {request.url.raw_path!r}")
        if call in self.failures:
            return self.failures[call](request)

        token = request.headers.get("Authorization", "").removeprefix("Bearer ")
        if token not in self.users:
            return github_error(401, "Bad credentials")
        if call == "user":
            return httpx2.Response(200, json={"login": self.users[token], "id": 1, "type": "User"})
        assert membership is not None
        org, team, login = (unquote(part) for part in membership.groups())
        if (org, team) != (ORG, TEAM) or login not in self.team:
            return github_error(404, "Not Found")
        return httpx2.Response(200, json={"state": self.team[login], "role": "member", "url": str(request.url)})
