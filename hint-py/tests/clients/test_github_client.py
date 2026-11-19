"""The GitHub client: what it sends, and what it makes of each answer of GitHub.

The endpoint that uses it, and the order of the checks, are in tests/api/test_model_debug.py.
"""

import logging

import httpx2
import pytest
from pydantic import SecretStr

from app.clients.github_client import GitHubClient, create_github_http_client
from app.config import Settings
from app.errors import GitHubFailedError, GitHubTokenInvalidError
from tests.github import INVITED, INVITED_TOKEN, MEMBER, ORG, OUTSIDER, TEAM, FakeGitHub, github_error
from tests.support import GITHUB_OTHER_TOKEN, GITHUB_TOKEN

TOKEN = SecretStr(GITHUB_TOKEN)


@pytest.fixture
def client(github: FakeGitHub) -> GitHubClient:
    return GitHubClient(github.http)


async def test_the_http_client_calls_the_github_api_with_the_headers_github_asks_for():
    http = create_github_http_client(Settings())
    try:
        assert str(http.base_url) == "https://api.github.com"
        assert http.headers["Accept"] == "application/vnd.github+json"
        assert http.headers["X-GitHub-Api-Version"] == "2022-11-28"
        assert http.headers["User-Agent"] == "hint"
    finally:
        await http.aclose()


async def test_the_login_is_the_login_of_the_user_of_the_token(client, github):
    assert await client.login(TOKEN) == MEMBER

    [call] = github.calls
    assert (call.method, call.url.path) == ("GET", "/user")
    assert call.headers["Authorization"] == f"Bearer {GITHUB_TOKEN}"


async def test_a_token_that_github_does_not_know_is_not_valid(client):
    with pytest.raises(GitHubTokenInvalidError):
        await client.login(SecretStr("ghp_not-a-token"))


@pytest.mark.parametrize(
    "answer",
    [
        github_error(403, "API rate limit exceeded"),
        github_error(500, "Server Error"),
        httpx2.Response(200, json={"id": 1}),
        httpx2.Response(200, json={"login": ""}),
        httpx2.Response(200, json=["a-developer"]),
        httpx2.Response(200, content=b"<html>Unicorn!</html>"),
    ],
    ids=["rate limited", "server error", "no login", "empty login", "not an object", "not json"],
)
async def test_any_other_answer_about_the_user_is_a_failure_of_github(client, github, answer):
    github.fail("user", answer)
    with pytest.raises(GitHubFailedError):
        await client.login(TOKEN)


async def test_an_active_member_is_in_the_team(client, github):
    assert await client.is_team_member(TOKEN, ORG, TEAM, MEMBER) is True

    [call] = github.calls
    assert (call.method, call.url.path) == ("GET", f"/orgs/{ORG}/teams/{TEAM}/memberships/{MEMBER}")
    assert call.headers["Authorization"] == f"Bearer {GITHUB_TOKEN}"


async def test_a_user_that_github_does_not_find_in_the_team_is_not_in_it(client):
    assert await client.is_team_member(SecretStr(GITHUB_OTHER_TOKEN), ORG, TEAM, OUTSIDER) is False


async def test_a_user_who_has_not_accepted_the_invitation_is_not_in_the_team(client):
    assert await client.is_team_member(SecretStr(INVITED_TOKEN), ORG, TEAM, INVITED) is False


async def test_the_names_cannot_change_the_path(client, github):
    await client.is_team_member(TOKEN, "a/b", "c?d", "e#f")
    assert github.calls[0].url.raw_path == b"/orgs/a%2Fb/teams/c%3Fd/memberships/e%23f"


async def test_a_token_that_github_refuses_for_the_team_is_not_valid(client, github):
    github.fail("membership", github_error(401, "Bad credentials"))
    with pytest.raises(GitHubTokenInvalidError):
        await client.is_team_member(TOKEN, ORG, TEAM, MEMBER)


@pytest.mark.parametrize(
    "answer",
    [
        github_error(403, "Resource not accessible by personal access token"),
        github_error(502, "Server Error"),
        httpx2.Response(200, json={"role": "member"}),
        httpx2.Response(200, json={"state": "something new"}),
        httpx2.Response(200, content=b"not json"),
    ],
    ids=["forbidden", "server error", "no state", "unknown state", "not json"],
)
async def test_any_other_answer_about_the_team_is_a_failure_of_github(client, github, answer):
    github.fail("membership", answer)
    with pytest.raises(GitHubFailedError):
        await client.is_team_member(TOKEN, ORG, TEAM, MEMBER)


@pytest.mark.parametrize(
    "error",
    [httpx2.ConnectError("Connection refused"), httpx2.ReadTimeout("timed out"), httpx2.RemoteProtocolError("closed")],
    ids=["no connection", "timeout", "connection dropped"],
)
@pytest.mark.parametrize("call", ["user", "membership"])
async def test_no_answer_from_github_is_a_failure_of_github(client, github, call, error):
    github.fail_to_connect(call, error)
    with pytest.raises(GitHubFailedError):
        if call == "user":
            await client.login(TOKEN)
        else:
            await client.is_team_member(TOKEN, ORG, TEAM, MEMBER)


async def test_a_failure_is_logged_with_the_status_and_the_message_of_github(client, github, caplog):
    github.fail("user", github_error(403, "API rate limit exceeded"))
    with pytest.raises(GitHubFailedError):
        await client.login(TOKEN)

    [failure] = [r for r in caplog.records if r.getMessage() == "GitHub failed"]
    assert (failure.levelno, failure.call, failure.status, failure.github_message) == (
        logging.ERROR,
        "user",
        403,
        "API rate limit exceeded",
    )


async def test_the_token_is_not_in_the_log(client, github, caplog):
    # Every test checks this (see `no_personal_data_in_logs`). This test makes each kind of log message.
    caplog.set_level(logging.DEBUG)
    await client.login(TOKEN)
    for call, answer in [("user", github_error(401, "Bad credentials")), ("user", github_error(500, "Error"))]:
        github.fail(call, answer)
        with pytest.raises((GitHubTokenInvalidError, GitHubFailedError)):
            await client.login(TOKEN)
    github.fail_to_connect("user", httpx2.ConnectError("Connection refused"))
    with pytest.raises(GitHubFailedError):
        await client.login(TOKEN)

    assert len(caplog.records) >= 4
    assert GITHUB_TOKEN not in caplog.text
