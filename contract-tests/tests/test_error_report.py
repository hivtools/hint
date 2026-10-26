"""POST /error-report: forwards to the (stubbed) issue_report_url and clones the project to the support user."""
from __future__ import annotations

import pytest

from hintcontract.controls import fault
from hintcontract.flows import SUPPORT_USER, TEST_USER, create_project, guest_open, login_and_open


def report(email=TEST_USER, project_id=None, **kw):
    d = {
        "email": email, "country": "South Africa", "projectId": project_id, "projectName": "South 2 Worldpop",
        "section": "Fit model", "modelRunId": "job12", "calibrateId": "1234",
        "downloadIds": {"spectrum": "spectrum123", "summary": "summary123", "coarse_output": "coarse123"},
        "errors": [{"detail": "Please contact support for troubleshooting1", "error": "OTHER_ERROR", "key": "go-now-then"},
                   {"detail": "Please contact support for support", "error": "OTHER_ERROR", "key": "go-later-then"}],
        "description": "description of the error msg", "stepsToReproduce": "step to reproduce desc",
        "browserAgent": "Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW)",
        "versions": {"naomi": "v1", "hintr": "v2", "rrq": "v3", "traduire": "v4", "hint": "v5"},
        "timeStamp": "2021-10-12T14:07:22.759Z",
    }
    d.update(kw)
    return d


def test_report_with_project_clones_it_to_support_user(scn):
    a = login_and_open(scn, project=False)
    p = create_project(a, "South 2 Worldpop").data
    r = a.post("/error-report", json=report(project_id=p["id"]), name="report with project")
    assert r.status == 200
    support = login_and_open(scn, "S", user=SUPPORT_USER, project=False)
    support.get("/projects/", name="support user received a copy")
    scn.db_rows("project")
    scn.db_rows("project_version")


def test_report_without_project_id(scn):
    a = login_and_open(scn, project=False)
    a.post("/error-report", json=report(project_id=None), name="no project")
    scn.db_rows("project")


def test_report_by_the_support_user_does_not_clone(scn):
    s = login_and_open(scn, "S", user=SUPPORT_USER, project=False)
    p = create_project(s, "support's own").data
    s.post("/error-report", json=report(email=SUPPORT_USER, project_id=p["id"]), name="support user reports")
    s.get("/projects/", name="still one project")
    scn.db_rows("project")


def test_report_as_guest(scn):
    a = guest_open(scn)
    a.post("/error-report", json=report(email="guest"), name="guest report, no project")
    a.post("/error-report", json=report(email="guest", project_id=5), name="guest report claiming a project id")


def test_report_email_comes_from_the_body_not_the_session(scn):
    """The cloned project is the session user's, the 'is support' check uses the email in the body."""
    a = login_and_open(scn, project=False)
    p = create_project(a, "mine").data
    a.post("/error-report", json=report(email=SUPPORT_USER, project_id=p["id"]), name="body claims to be the support user")
    scn.db_rows("project")
    a.post("/error-report", json=report(email="someone.else@example.com", project_id=p["id"]), name="body has another email")
    scn.db_rows("project")


def test_report_for_unknown_or_foreign_project(scn):
    a = login_and_open(scn, "A", project=False)
    b = login_and_open(scn, "B", user=SUPPORT_USER, project=False)
    p = create_project(b, "bees").data
    a.post("/error-report", json=report(project_id=999), name="unknown project id")
    a.post("/error-report", json=report(project_id=p["id"]), name="someone else's project id")
    scn.db_rows("project")


@pytest.mark.needs_db
def test_report_when_support_user_does_not_exist(scn):
    a = login_and_open(scn, project=False)
    p = create_project(a, "p").data
    if scn.db:
        scn.db.execute("delete from users where id = %s", (SUPPORT_USER,))
    a.post("/error-report", json=report(project_id=p["id"]), name="support account missing")
    scn.db_rows("project")


def test_report_when_notification_fails(scn):
    a = login_and_open(scn, project=False)
    p = create_project(a, "p").data
    for label, action in {
        "flow answers 500": {"type": "status", "status": 500, "json": {"statusCode": 500, "description": "Internal Server Error"}},
        "flow answers 400 text": {"type": "status", "status": 400, "body": "bad request", "content_type": "text/plain"},
        "flow answers 502 html": {"type": "status", "status": 502, "body": "<h1>502 Bad Gateway</h1>", "content_type": "text/html"},
        "flow connection dropped": {"type": "close"},
        "flow answers garbage with 200": {"type": "raw", "status": 200, "body": "garbage"},
    }.items():
        scn.set_faults("stub", [fault(action, r"^/flow$")])
        a.post("/error-report", json=report(project_id=p["id"]), name=label)
    scn.db_rows("project")


def test_report_bad_requests(scn):
    a = login_and_open(scn, project=False)
    a.post("/error-report", name="no body")
    a.post("/error-report", json={}, name="empty object")
    a.post("/error-report", json={"email": TEST_USER}, name="most fields missing")
    d = report()
    del d["errors"]
    a.post("/error-report", json=d, name="errors missing")
    a.post("/error-report", json=report(projectId="abc"), name="projectId not a number")
    a.post("/error-report", content_type="application/json", raw_body=b"{no", name="malformed json")
    a.get("/error-report", name="wrong method")
