"""POST /error-report (app/routers/error_report.py): the report goes to the Teams teams_flow, and the support user gets a copy of
the project.

What the reporter makes of each answer of the flow is in tests/clients/test_issue_reporter.py.
"""

import httpx2
import pytest
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncEngine

from app.db.database import create_db_session_factory
from app.db.models import User
from tests.api.helpers import assert_failure, create_project, make_client
from tests.support import OTHER_USER, USER
from tests.teams_flow import OK

SUPPORT_USER = OTHER_USER  # the default support_email


def report(email: str = USER, project_id: int | None = None, **fields) -> dict:
    """A report as the Vue app sends it (`ErrorReport.vue`)."""
    body = {
        "email": email,
        "country": "Malawi",
        "projectId": project_id,
        "projectName": "Malawi 2026",
        "section": "Fit model",
        "modelRunId": "run1",
        "calibrateId": "calibrate1",
        "downloadIds": {"spectrum": "spectrum1", "summary": "summary1", "coarse_output": "coarse1"},
        "errors": [{"detail": "Something went wrong", "error": "OTHER_ERROR", "key": "a-key"}],
        "description": "The fit stopped",
        "stepsToReproduce": "Fit the model",
        "browserAgent": "Mozilla/5.0",
        "versions": {"naomi": "v1", "hintr": "v2", "rrq": "v3", "traduire": "v4", "hint": "v5"},
        "timeStamp": "2026-11-23T10:00:00.000Z",
    }
    return body | fields


async def projects_of(user: str) -> list[dict]:
    async with make_client(user) as client:
        r = await client.get("/projects/")
    assert r.status_code == 200
    return r.json()["data"]


async def test_the_report_is_sent_and_the_project_is_copied_to_the_support_user(api, teams_flow):
    project = await create_project(api, "Malawi 2026")
    await api.post(f"/project/{project['id']}/version", json={"parent": project["versions"][0]["id"]})

    r = await api.post("/error-report", json=report(project_id=project["id"]))

    assert r.status_code == 200
    # The data is the flow's answer
    assert r.json() == {"data": OK, "errors": [], "status": "success"}
    assert teams_flow.reports() == [report(project_id=project["id"])]
    assert teams_flow.calls[0].headers["content-type"] == "application/json"
    [copy] = await projects_of(SUPPORT_USER)
    assert copy["name"] == "Malawi 2026"
    assert copy["sharedBy"] == USER
    assert len(copy["versions"]) == 2
    # The reporter's project is as it was
    assert [p["id"] for p in await projects_of(USER)] == [project["id"]]


async def test_a_report_with_no_project_copies_nothing(api, teams_flow):
    r = await api.post("/error-report", json=report(project_id=None))

    assert r.status_code == 200
    assert len(teams_flow.calls) == 1
    assert await projects_of(SUPPORT_USER) == []


async def test_the_support_user_gets_no_copy_of_their_own_project(other_api, teams_flow):
    project = await create_project(other_api, "support's own")

    r = await other_api.post("/error-report", json=report(email=SUPPORT_USER, project_id=project["id"]))

    assert r.status_code == 200
    assert [p["id"] for p in await projects_of(SUPPORT_USER)] == [project["id"]]


async def test_whether_the_reporter_is_the_support_user_is_the_email_in_the_body(api, teams_flow):
    """The email is what the user typed. The project is still checked against who is logged in."""
    project = await create_project(api)

    r = await api.post("/error-report", json=report(email=SUPPORT_USER, project_id=project["id"]))
    assert r.status_code == 200
    assert await projects_of(SUPPORT_USER) == []

    r = await api.post("/error-report", json=report(email="someone.else@example.com", project_id=project["id"]))
    assert r.status_code == 200
    assert len(await projects_of(SUPPORT_USER)) == 1
    assert len(teams_flow.calls) == 2


async def test_a_guest_can_report_but_has_no_project_to_copy(api, teams_flow):
    async with make_client("guest") as guest:
        r = await guest.post("/error-report", json=report(email="guest"))
        assert r.status_code == 200

        r = await guest.post("/error-report", json=report(email="guest", project_id=5))

    # The report has gone before the project is looked at
    assert_failure(r, 400, "Project does not exist.")
    assert len(teams_flow.calls) == 2


@pytest.mark.parametrize("whose", ["someone else's", "unknown"])
async def test_a_project_that_is_not_the_reporters_is_not_copied(api, other_api, teams_flow, whose):
    project_id = (await create_project(other_api, "bees"))["id"] if whose == "someone else's" else 999

    r = await api.post("/error-report", json=report(project_id=project_id))

    assert_failure(r, 400, "Project does not exist.")
    assert len(teams_flow.calls) == 1
    assert [p["name"] for p in await projects_of(SUPPORT_USER)] == (["bees"] if whose == "someone else's" else [])


async def test_a_missing_support_user_is_an_error_after_the_report_has_gone(api, engine: AsyncEngine, teams_flow):
    project = await create_project(api)
    async with create_db_session_factory(engine)() as db_session, db_session.begin():
        await db_session.execute(delete(User).where(User.id == SUPPORT_USER))

    r = await api.post("/error-report", json=report(project_id=project["id"]))

    assert_failure(r, 400, "User does not exist.")
    assert len(teams_flow.calls) == 1


async def test_the_support_user_is_looked_up_before_the_project(api, engine: AsyncEngine, teams_flow):
    async with create_db_session_factory(engine)() as db_session, db_session.begin():
        await db_session.execute(delete(User).where(User.id == SUPPORT_USER))

    r = await api.post("/error-report", json=report(project_id=999))

    assert_failure(r, 400, "User does not exist.")


async def test_the_support_user_can_be_set(api, teams_flow, settings_overrides):
    settings_overrides["support_email"] = "guest"  # any user that exists
    project = await create_project(api)

    r = await api.post("/error-report", json=report(project_id=project["id"]))

    assert r.status_code == 200
    assert await projects_of(SUPPORT_USER) == []


@pytest.mark.parametrize(
    ("answer", "status"),
    [
        (httpx2.Response(500, json={"statusCode": 500, "description": "Internal Server Error"}), 500),
        (httpx2.Response(400, text="bad request"), 500),
        (httpx2.Response(200, text="garbage"), 500),
        (httpx2.ConnectError("refused"), 500),
        (httpx2.Response(403, json={"status": "failure", "data": {}, "errors": []}), 403),
    ],
    ids=["500 json", "400 text", "200 garbage", "no connection", "hint's own failure"],
)
async def test_no_copy_when_the_report_was_not_taken(api, teams_flow, answer, status):
    teams_flow.answer = answer
    project = await create_project(api)

    r = await api.post("/error-report", json=report(project_id=project["id"]))

    assert r.status_code == status
    assert r.json()["status"] == "failure"
    assert await projects_of(SUPPORT_USER) == []


async def test_a_flow_that_answers_202_with_no_body_took_the_report(api, teams_flow):
    """What a Power Automate flow with no Response action answers. The goldens do not have this case."""
    teams_flow.answer = httpx2.Response(202)
    project = await create_project(api)

    r = await api.post("/error-report", json=report(project_id=project["id"]))

    assert r.status_code == 202
    assert r.json() == {"data": None, "errors": [], "status": "success"}
    assert len(await projects_of(SUPPORT_USER)) == 1


async def test_with_no_flow_address_the_report_is_an_unexpected_error(api, teams_flow, settings_overrides):
    settings_overrides["issue_report_url"] = ""

    r = await api.post("/error-report", json=report())

    assert r.status_code == 500
    assert "An unexpected error occurred" in r.json()["errors"][0]["detail"]
    assert teams_flow.calls == []


async def test_what_is_sent_is_the_report_with_its_own_fields_only(api, teams_flow):
    body = report(somethingElse="dropped")
    body["errors"] = [{"detail": "only a detail"}, {"detail": None, "error": "E", "key": "k", "extra": 1}]

    r = await api.post("/error-report", json=body)

    assert r.status_code == 200
    [sent] = teams_flow.reports()
    assert "somethingElse" not in sent
    assert sent["errors"] == [
        {"detail": "only a detail", "error": "", "key": ""},
        {"detail": None, "error": "E", "key": "k"},
    ]


@pytest.mark.parametrize(
    "body",
    [
        None,
        {},
        {"email": USER},
        {k: v for k, v in report().items() if k != "errors"},
        report(projectId="abc"),
    ],
    ids=["no body", "empty object", "most fields missing", "errors missing", "projectId not a number"],
)
async def test_bad_requests_send_nothing(api, teams_flow, body):
    r = await api.post("/error-report", json=body)

    assert r.status_code == 400
    assert teams_flow.calls == []


async def test_malformed_json_and_wrong_method(api, teams_flow):
    r = await api.post("/error-report", content=b"{no", headers={"Content-Type": "application/json"})
    assert r.status_code == 400

    r = await api.get("/error-report")
    assert r.status_code == 405
    assert teams_flow.calls == []
