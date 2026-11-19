"""The GitHub API. This API asks it one thing: is the user of a GitHub token a member of a GitHub team?

The debug zip of a model run has a user's input files in it. Only the developers in one GitHub team may download it.
They send a GitHub token, and the `github_team_member` dependency (app/dependencies.py) checks it with this client.

The token is a secret. It goes only in the header of a call to GitHub. Never log it, and never put it in an error.
"""

import time
from typing import Annotated, NoReturn
from urllib.parse import quote

import httpx2
import structlog
from fastapi import Depends, Request
from pydantic import SecretStr

from app.clients.responses import TIMEOUT_SECONDS, parse_json
from app.config import Settings
from app.errors import GitHubFailedError, GitHubTokenInvalidError

log = structlog.get_logger()

# What GitHub asks every client to send. GitHub refuses a call that has no User-Agent.
GITHUB_HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "hint",
}


def create_github_http_client(settings: Settings) -> httpx2.AsyncClient:
    # Does not connect yet. The first request does.
    return httpx2.AsyncClient(base_url=settings.github_api_url, headers=GITHUB_HEADERS, timeout=TIMEOUT_SECONDS)


class GitHubClient:
    """Calls to GitHub, each made with the token of the caller.

    A token that GitHub does not accept raises `GitHubTokenInvalidError`. Any other answer that is not expected, or no
    answer, raises `GitHubFailedError`.
    """

    def __init__(self, http: httpx2.AsyncClient):
        self._http = http

    async def login(self, token: SecretStr) -> str:
        """The login (the user name) of the user of the token."""
        r = await self._get("user", "/user", token)
        if r.status_code != 200:
            self._fail("user", r)
        is_json, body = parse_json(r.content)
        login = body.get("login") if is_json and isinstance(body, dict) else None
        if not isinstance(login, str) or not login:
            log.error("GitHub sent no login for the token", status=r.status_code)
            raise GitHubFailedError()
        return login

    async def is_team_member(self, token: SecretStr, org: str, team_slug: str, login: str) -> bool:
        """Whether the user is an active member of the team.

        GitHub answers 404 when the user is not in the team. It also answers 404 when the token cannot see the team: a
        classic token needs the read:org scope. A user who is invited but has not accepted yet is "pending", and is not
        a member.
        """
        path = f"/orgs/{quote(org, safe='')}/teams/{quote(team_slug, safe='')}/memberships/{quote(login, safe='')}"
        r = await self._get("team membership", path, token)
        if r.status_code == 404:
            return False
        if r.status_code != 200:
            self._fail("team membership", r)
        is_json, body = parse_json(r.content)
        state = body.get("state") if is_json and isinstance(body, dict) else None
        if state not in ("active", "pending"):
            log.error("GitHub sent no state for the team membership", status=r.status_code)
            raise GitHubFailedError()
        return state == "active"

    async def _get(self, call: str, path: str, token: SecretStr) -> httpx2.Response:
        """A GET with the token. `call` names the call in the log."""
        started = time.perf_counter()
        try:
            r = await self._http.get(path, headers={"Authorization": f"Bearer {token.get_secret_value()}"})
        except httpx2.RequestError:
            # The message of the library has the address. It does not have the headers, so it does not have the token.
            log.exception("No response from GitHub", call=call)
            raise GitHubFailedError() from None
        log.info(
            "GitHub request",
            call=call,
            status=r.status_code,
            duration_ms=round((time.perf_counter() - started) * 1000),
        )
        return r

    @staticmethod
    def _fail(call: str, r: httpx2.Response) -> NoReturn:
        """Raises the error for an answer with a status that is not expected."""
        if r.status_code == 401:
            log.warning("GitHub does not accept the token", call=call)
            raise GitHubTokenInvalidError()
        # GitHub's message says what went wrong, for example that the rate limit was reached. It does not have the
        # token in it.
        is_json, body = parse_json(r.content)
        message = body.get("message") if is_json and isinstance(body, dict) else None
        log.error("GitHub failed", call=call, status=r.status_code, github_message=str(message))
        raise GitHubFailedError()


def get_github_client(request: Request) -> GitHubClient:
    return GitHubClient(request.app.state.github_http)


GitHub = Annotated[GitHubClient, Depends(get_github_client)]
