"""TeamsFlowReporter (app/clients/issue_reporter.py): what it sends, and what it makes of each answer of the teams_flow."""

import logging
from collections.abc import AsyncIterator

import httpx2
import pytest
import pytest_asyncio
from pydantic import SecretStr

from app.clients.issue_reporter import TeamsFlowReporter
from app.schemas import ErrorReport
from tests.teams_flow import OK, TEAMS_FLOW_URL, FakeTeamsFlow

REPORT = ErrorReport(
    email="someone@example.com",
    country="Malawi",
    project_id=1,
    project_name="p",
    section="Fit model",
    model_run_id="run1",
    calibrate_id="c1",
    download_ids={"spectrum": "s1"},
    errors=[],
    description="d",
    steps_to_reproduce="s",
    browser_agent="b",
    versions={"hint": "v5"},
    time_stamp="2026-11-23T10:00:00.000Z",
)


@pytest_asyncio.fixture
async def teams_flow() -> AsyncIterator[FakeTeamsFlow]:
    fake = FakeTeamsFlow()
    yield fake
    await fake.http.aclose()


def reporter(teams_flow: FakeTeamsFlow, language: str = "en") -> TeamsFlowReporter:
    return TeamsFlowReporter(teams_flow.http, SecretStr(TEAMS_FLOW_URL), language)


async def test_the_report_is_posted_as_json_with_camel_case_names(teams_flow):
    answer = await reporter(teams_flow).send(REPORT)

    assert (answer.status_code, answer.data) == (200, OK)
    [call] = teams_flow.calls
    assert call.method == "POST"
    assert str(call.url) == TEAMS_FLOW_URL
    assert teams_flow.reports()[0]["projectId"] == 1
    assert teams_flow.reports()[0]["stepsToReproduce"] == "s"


@pytest.mark.parametrize(
    ("answer", "status", "detail"),
    [
        # As for hintr: JSON that is not a message is the message as text
        (httpx2.Response(500, json={"statusCode": 500}), 500, '{"statusCode": 500}'),
        (httpx2.Response(400, json="the flow's message"), 400, "the flow's message"),
        (httpx2.Response(502, text="<h1>502 Bad Gateway</h1>"), 500, "Could not parse response."),
        (httpx2.Response(200, text="garbage"), 500, "Could not parse response."),
        (httpx2.ConnectError("refused"), 500, "No response returned. The request may have timed out."),
    ],
    ids=["500 json", "400 json text", "502 html", "200 garbage", "no connection"],
)
async def test_an_answer_that_is_not_a_success_is_a_failure(teams_flow, answer, status, detail):
    teams_flow.answer = answer

    result = await reporter(teams_flow).send(REPORT)

    assert result.status_code == status
    assert result.envelope["errors"] == [{"error": "OTHER_ERROR", "detail": detail}]


async def test_an_empty_success_is_a_success(teams_flow):
    teams_flow.answer = httpx2.Response(202)

    result = await reporter(teams_flow).send(REPORT)

    assert (result.status_code, result.data) == (202, None)


async def test_the_messages_are_in_the_users_language(teams_flow):
    teams_flow.answer = httpx2.ConnectError("refused")

    result = await reporter(teams_flow, "fr").send(REPORT)

    assert result.envelope["errors"][0]["detail"] == "Aucune réponse reçue. La requête a peut-être expiré."


async def test_the_address_is_not_logged(teams_flow, caplog):
    """The key of the flow is in its address. `no_personal_data_in_logs` checks every test for it, this makes sure that
    there is something to check: a failed call, and the line httpx logs for each call."""
    caplog.set_level(logging.INFO)
    teams_flow.answer = httpx2.ConnectError(f"cannot connect to {TEAMS_FLOW_URL}")
    await reporter(teams_flow).send(REPORT)
    teams_flow.answer = httpx2.Response(200, json=OK)
    await reporter(teams_flow).send(REPORT)

    assert "No response from the issue report flow" in caplog.text
    assert "sig=REDACTED" in caplog.text


async def test_no_address_is_an_error_and_sends_nothing(teams_flow):
    with pytest.raises(RuntimeError, match="HINT_ISSUE_REPORT_URL"):
        await TeamsFlowReporter(teams_flow.http, SecretStr(""), "en").send(REPORT)
    assert teams_flow.calls == []
