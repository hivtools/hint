"""GET /model/debug/{id} (app/routers/model.py): the debug zip of a model run, for the developers in one GitHub team.

The caller shows a GitHub token, not a hint login (`github_team_member` in app/dependencies.py). What the GitHub client
makes of each answer of GitHub is in tests/clients/test_github_client.py, and how hintr's zip is passed on is in
tests/clients/test_hintr_client.py.
"""

import logging
from collections.abc import AsyncIterator

import httpx2
import pytest
import pytest_asyncio

from app.main import app
from tests.api.helpers import assert_failure, make_client
from tests.github import INVITED_TOKEN, MEMBER, ORG, OUTSIDER, TEAM, github_error
from tests.support import GITHUB_OTHER_TOKEN, GITHUB_TOKEN, USER

ZIP = b"PK\x03\x04 pretend this is the debug zip"
DISPOSITION = 'attachment; filename="t1_2026-11-19-10-00-00_naomi_debug.zip"'
MEMBER_AUTH = {"Authorization": f"Bearer {GITHUB_TOKEN}"}

TOKEN_REQUIRED = 'A GitHub token is needed. Send it in the Authorization header as "Bearer <token>".'
TOKEN_INVALID = "GitHub did not accept the token. Check that it is correct and has not expired."
NOT_IN_TEAM = (
    "You may not download this. Your GitHub user must be a member of the team that may download debug files, and the "
    "token must be able to read the team (a classic token needs the read:org scope)."
)
GITHUB_FAILED = "Could not check the GitHub token, because GitHub did not answer as expected. Try again later."


async def pieces(*chunks: bytes) -> AsyncIterator[bytes]:
    for chunk in chunks:
        yield chunk


@pytest_asyncio.fixture
async def caller(github, github_team, hintr) -> AsyncIterator[httpx2.AsyncClient]:
    """Someone who calls the API with no hint login: the proxy sends no identity for this path. GitHub and the team are
    set up, and hintr has the zip of the task t1."""
    hintr.answer(
        200,
        content=pieces(ZIP[:10], ZIP[10:]),
        headers={
            "Content-Type": "application/octet-stream",
            "Content-Disposition": DISPOSITION,
            "Content-Length": str(len(ZIP)),
        },
    )
    transport = httpx2.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx2.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


async def test_a_member_of_the_team_gets_the_zip(caller, github, hintr):
    r = await caller.get("/model/debug/t1", headers=MEMBER_AUTH)

    assert r.status_code == 200
    assert r.content == ZIP
    assert r.headers["content-type"] == "application/octet-stream"
    assert r.headers["content-disposition"] == DISPOSITION
    assert r.headers["content-length"] == str(len(ZIP))
    assert github.paths() == ["/user", f"/orgs/{ORG}/teams/{TEAM}/memberships/{MEMBER}"]
    assert [(c.method, c.url.path) for c in hintr.calls] == [("GET", "/model/debug/t1")]


async def test_who_got_in_is_logged_by_their_github_login(caller, caplog):
    await caller.get("/model/debug/t1", headers=MEMBER_AUTH)

    [record] = [r for r in caplog.records if r.getMessage() == "GitHub user is in the team"]
    assert (record.github_login, record.org, record.team) == (MEMBER, ORG, TEAM)


@pytest.mark.parametrize(
    "authorization",
    [None, "Basic dXNlcjpwYXNz", "Bearer", "Bearer ", "Token abc", GITHUB_TOKEN],
    ids=["no header", "basic", "bearer without token", "bearer and a space", "wrong scheme", "no scheme"],
)
async def test_without_a_bearer_token_nobody_gets_in(caller, github, hintr, authorization):
    headers = {"Authorization": authorization} if authorization is not None else {}

    r = await caller.get("/model/debug/t1", headers=headers)

    assert_failure(r, 401, TOKEN_REQUIRED)
    assert r.headers["www-authenticate"] == "Bearer"
    assert github.calls == []
    assert hintr.calls == []


async def test_a_hint_login_is_not_enough(github, github_team, hintr):
    # The proxy does not send an identity for this path, but even with one there is no way in without a token
    async with make_client(USER) as logged_in:
        r = await logged_in.get("/model/debug/t1")

    assert_failure(r, 401, TOKEN_REQUIRED)
    assert github.calls == []
    assert hintr.calls == []


async def test_a_token_that_github_does_not_accept_does_not_get_in(caller, github, hintr):
    r = await caller.get("/model/debug/t1", headers={"Authorization": "Bearer ghp_not-a-token"})

    assert_failure(r, 401, TOKEN_INVALID)
    assert r.headers["www-authenticate"] == 'Bearer error="invalid_token"'
    assert github.paths() == ["/user"]
    assert hintr.calls == []


async def test_a_user_who_is_not_in_the_team_does_not_get_in(caller, github, hintr, caplog):
    r = await caller.get("/model/debug/t1", headers={"Authorization": f"Bearer {GITHUB_OTHER_TOKEN}"})

    assert_failure(r, 403, NOT_IN_TEAM)
    assert github.paths() == ["/user", f"/orgs/{ORG}/teams/{TEAM}/memberships/{OUTSIDER}"]
    assert hintr.calls == []
    [record] = [r for r in caplog.records if r.getMessage() == "GitHub user is not in the team"]
    assert (record.levelno, record.github_login) == (logging.WARNING, OUTSIDER)


async def test_a_user_who_is_invited_but_has_not_accepted_does_not_get_in(caller, hintr):
    r = await caller.get("/model/debug/t1", headers={"Authorization": f"Bearer {INVITED_TOKEN}"})

    assert_failure(r, 403, NOT_IN_TEAM)
    assert hintr.calls == []


async def test_a_member_of_another_team_does_not_get_in(caller, github, settings_overrides, hintr):
    settings_overrides["github_auth_team_slug"] = "another-team"

    r = await caller.get("/model/debug/t1", headers=MEMBER_AUTH)

    assert_failure(r, 403, NOT_IN_TEAM)
    assert github.calls[-1].url.path == f"/orgs/{ORG}/teams/another-team/memberships/{MEMBER}"
    assert hintr.calls == []


@pytest.mark.parametrize(
    ("org", "team"), [("", ""), (ORG, ""), ("", TEAM)], ids=["neither", "no team", "no organisation"]
)
async def test_with_no_team_in_the_settings_nobody_gets_in_and_github_is_not_asked(
    caller, github, settings_overrides, hintr, caplog, org, team
):
    settings_overrides["github_auth_org"] = org
    settings_overrides["github_auth_team_slug"] = team

    r = await caller.get("/model/debug/t1", headers=MEMBER_AUTH)

    assert_failure(r, 403, NOT_IN_TEAM)
    assert github.calls == []
    assert hintr.calls == []
    assert any(r.getMessage().startswith("No GitHub team is set") for r in caplog.records)


async def test_by_default_no_team_is_set(github, hintr):
    transport = httpx2.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx2.AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/model/debug/t1", headers=MEMBER_AUTH)

    assert r.status_code == 403
    assert github.calls == []


@pytest.mark.parametrize(
    ("call", "answer"),
    [
        ("user", github_error(500, "Server Error")),
        ("user", github_error(403, "API rate limit exceeded")),
        ("user", httpx2.Response(200, json={"id": 1})),
        ("membership", github_error(503, "Service Unavailable")),
        ("membership", httpx2.Response(200, content=b"<html>Unicorn!</html>")),
    ],
    ids=["user 500", "user rate limited", "user without login", "team 503", "team not json"],
)
async def test_when_github_fails_nobody_gets_in(caller, github, hintr, call, answer):
    github.fail(call, answer)

    r = await caller.get("/model/debug/t1", headers=MEMBER_AUTH)

    assert_failure(r, 502, GITHUB_FAILED)
    assert hintr.calls == []


@pytest.mark.parametrize(
    "error",
    [httpx2.ReadTimeout("timed out"), httpx2.ConnectTimeout("timed out"), httpx2.ConnectError("Connection refused")],
    ids=["read timeout", "connect timeout", "no connection"],
)
@pytest.mark.parametrize("call", ["user", "membership"])
async def test_when_github_does_not_answer_nobody_gets_in(caller, github, hintr, call, error):
    github.fail_to_connect(call, error)

    r = await caller.get("/model/debug/t1", headers=MEMBER_AUTH)

    assert_failure(r, 502, GITHUB_FAILED)
    assert hintr.calls == []


@pytest.mark.parametrize(
    ("language", "message"),
    [
        ("fr", "Un jeton GitHub est nécessaire."),
        ("pt", "É necessário um token do GitHub."),
    ],
)
async def test_the_message_is_in_the_language_of_the_request(caller, language, message):
    r = await caller.get("/model/debug/t1", headers={"Accept-Language": language})
    assert r.json()["errors"][0]["detail"].startswith(message)


async def test_a_task_that_hintr_does_not_know_is_hintrs_own_failure(caller, hintr):
    invalid_task = {
        "status": "failure",
        "errors": [{"error": "INVALID_TASK", "detail": "Failed to get task data for 'nope'", "key": "abc"}],
        "data": None,
    }
    hintr.answer(400, json=invalid_task)

    r = await caller.get("/model/debug/nope", headers=MEMBER_AUTH)

    assert r.status_code == 400
    assert r.json() == invalid_task
    assert r.headers["content-type"] == "application/json"


async def test_when_hintr_does_not_answer_it_is_a_500(caller, hintr):
    hintr.fail_to_connect(httpx2.ConnectError("refused"))

    r = await caller.get("/model/debug/t1", headers=MEMBER_AUTH)

    assert_failure(r, 500, "No response returned. The request may have timed out.")


async def test_the_task_id_is_sent_to_hintr_as_one_part_of_the_path(caller, hintr):
    await caller.get("/model/debug/a%3Fb%23c", headers=MEMBER_AUTH)
    assert hintr.calls[0].url.raw_path == b"/model/debug/a%3Fb%23c"


async def test_no_task_id_is_not_found(caller, github):
    r = await caller.get("/model/debug/", headers=MEMBER_AUTH)
    assert r.status_code == 404
    assert github.calls == []


async def test_the_token_is_never_in_the_log_or_the_answer(caller, github, hintr, caplog):
    # Every test checks the log (see `no_personal_data_in_logs`). This one goes through each outcome in one test, and
    # also looks at what the caller gets back.
    caplog.set_level(logging.DEBUG)
    outcomes = []
    for token in (GITHUB_TOKEN, GITHUB_OTHER_TOKEN, INVITED_TOKEN, "ghp_not-a-token"):
        outcomes.append(await caller.get("/model/debug/t1", headers={"Authorization": f"Bearer {token}"}))
    github.fail("user", github_error(500, "Server Error"))
    outcomes.append(await caller.get("/model/debug/t1", headers=MEMBER_AUTH))
    github.fail_to_connect("user", httpx2.ReadTimeout("timed out"))
    outcomes.append(await caller.get("/model/debug/t1", headers=MEMBER_AUTH))

    assert [r.status_code for r in outcomes] == [200, 403, 403, 401, 502, 502]
    for secret in (GITHUB_TOKEN, GITHUB_OTHER_TOKEN, INVITED_TOKEN):
        assert secret not in caplog.text
        for r in outcomes[1:]:
            assert secret not in r.text
            assert secret not in str(r.headers)
