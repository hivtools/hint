"""Static pages, session cookies, unknown routes, wrong methods, compression, tiny read-only endpoints."""
from __future__ import annotations

import pytest

from hintcontract.flows import GUEST, TEST_USER, login_and_open, upload


@pytest.mark.parametrize("path", ["/", "/projects", "/accessibility", "/privacy"], ids=["root", "projects", "accessibility", "privacy"])
def test_app_pages_guest(scn, path):
    a = scn.client("A")
    r = a.get(path, name=f"guest GET {path}", check_cookie=True,
              html_checks=['var currentUser = "guest"', 'data-user="guest"', 'data-title="Naomi"'])
    assert r.status == 200 and r.content_type.startswith("text/html")


@pytest.mark.parametrize("path", ["/", "/projects", "/accessibility", "/privacy"], ids=["root", "projects", "accessibility", "privacy"])
def test_app_pages_logged_in(scn, path):
    a = scn.client("A")
    a.login()
    r = a.get(path, name=f"logged in GET {path}",
              html_checks=[f'var currentUser = "{TEST_USER}"', f'data-user="{TEST_USER}"', 'data-title="Naomi"'])
    assert r.status == 200


def test_login_page_default(scn):
    r = scn.client("A").get("/login", html_checks=['<title>Login</title>', 'id="login-form"', 'value=""'])
    assert r.status == 200


def test_login_page_error_variants(scn):
    a = scn.client("A")
    a.get("/login", params={"error": "BadCredentialsException", "username": "x@y.com"}, name="bad credentials error",
          html_checks=["Username or password is incorrect", 'value="x@y.com"'])
    a.get("/login", params={"error": "SessionExpired"}, name="session expired default message",
          html_checks=["Your session expired. Please log in again"])
    a.get("/login", params={"error": "SessionExpired", "message": "Custom expiry message"},
          name="session expired custom message", html_checks=["Custom expiry message"])
    a.get("/login", params={"error": "Anything"}, name="any other error value",
          html_checks=["Username or password is incorrect"])
    a.get("/login", params={"redirectTo": "/projects"}, name="redirectTo is used for continue as guest",
          html_checks=['href="/projects">Continue as guest'])


@pytest.mark.quirk
def test_login_page_does_not_escape_username(scn):
    """quirk: `username` query parameter is injected into the form unescaped (freemarker .ftl, no auto-escape)."""
    scn.client("A").get("/login", params={"username": '"><b>x</b>'}, html_checks=['value=""><b>x</b>"'])


def test_unknown_route_json(scn):
    a = scn.client("A")
    r = a.get("/nonsense/route/", name="unknown route, default Accept")
    assert r.status == 404
    a.get("/nonsense/route/", headers={"Accept": "application/json"}, name="unknown route, Accept json")
    a.get("/nonsense/route/", headers={"Accept-Language": "fr"}, name="unknown route, french")
    a.post("/nonsense/route/", form={"a": "b"}, name="unknown route, POST")


def test_unknown_route_html_page(scn):
    r = scn.client("A").get("/nonsense/route/", headers={"Accept": "text/html"},
                            html_checks=["404 Error Page"])
    assert r.status == 404 and r.content_type.startswith("text/html")


def test_wrong_http_method(scn):
    a = scn.client("A")
    a.delete("/", name="DELETE / ")
    a.post("/sso", name="POST /sso")
    a.get("/model/run", name="GET on POST-only /model/run")
    a.post("/baseline/validate", name="POST on GET-only /baseline/validate")
    a.request("PUT", "/baseline/pjnz", name="PUT /baseline/pjnz")


def test_static_assets(scn):
    a = scn.client("A")
    r = a.get("/public/css/app.css", name="css asset", ignore_body=True)
    assert r.status == 200 and r.content_type.startswith("text/css")
    r = a.get("/public/favicon.ico", name="favicon", ignore_body=True)
    assert r.status == 200


@pytest.mark.quirk
def test_missing_static_asset_is_500_not_404(scn):
    """quirk: a missing /public/** file is answered with the Spring Boot default 500 error JSON."""
    scn.client("A").get("/public/css/does-not-exist.css", name="missing asset")


def test_json_responses_are_gzipped_when_accepted(scn):
    a = scn.client("A")
    a.open_app()
    r = a.post("/baseline/shape", files={"file": "malawi.geojson"}, headers={"Accept-Encoding": "gzip"},
               name="upload shape accept gzip")
    assert r.headers.get("content-encoding") == "gzip"
    r = a.get("/public/css/app.css", headers={"Accept-Encoding": "gzip"}, name="css accept gzip", ignore_body=True)
    assert r.headers.get("content-encoding") == "gzip"


def test_small_json_response_not_gzipped(scn):
    a = scn.client("A")
    r = a.get("/sso", headers={"Accept-Encoding": "gzip"}, name="small response")
    assert r.headers.get("content-encoding") is None


def test_sessions_are_isolated_between_clients(scn):
    a, b = scn.client("A"), scn.client("B")
    a.open_app(check_cookie=True)
    b.open_app(check_cookie=True)
    assert a.raw.cookies != b.raw.cookies
    upload(a, "pjnz")
    a.get("/baseline/pjnz", name="A sees its pjnz")
    b.get("/baseline/pjnz", name="B does not see A's pjnz")


def test_session_persists_across_requests(scn):
    a = scn.client("A")
    a.open_app(check_cookie=True)
    upload(a, "pjnz")
    a.get("/baseline/pjnz", name="same cookie sees file")
    saved = dict(a.raw.cookies)
    a.raw.clear_cookies()
    a.get("/baseline/pjnz", name="no cookie = new session = no file")
    a.raw.cookies.update(saved)
    a.get("/baseline/pjnz", name="old cookie restored = file again")


def test_sso_flag_and_schemas_for_guest(scn):
    a = scn.client("A")
    a.get("/sso")
    a.get("/adr/schemas")
    a.get("/adr/schemas/", name="adr schemas trailing slash")


def test_metrics_for_guest(scn):
    """Worker counts depend on what hintr is doing right now, so only the format is asserted (the numbers are
    covered with injected worker states in test_hintr_faults)."""
    r = scn.client("A").get("/metrics", ignore_body=True)
    assert r.status == 200 and r.content_type.startswith("text/plain")
    lines = r.text.split("\n")
    assert lines[0] == "running 1"
    assert [l.split(" ")[0] for l in lines[1:]] == ["busy_workers", "idle_workers", "paused_workers", "exited_workers",
                                                     "lost_workers", "live_workers"]


def test_hintr_version_for_guest(scn):
    r = scn.client("A").get("/meta/hintr/version")
    assert r.status == 200


@pytest.mark.parametrize("path", ["/project/current", "/user/a@b.com/exists", "/adr/key", "/adr/datasets",
                                  "/adr/orgs", "/project/1/version/abc", "/model/debug/abc"],
                         ids=["project_current", "user_exists", "adr_key", "adr_datasets", "adr_orgs", "project_version", "model_debug"])
def test_guest_gets_401_on_secured_prefixes(scn, path):
    r = scn.client("A").get(path, name=f"guest GET {path}")
    assert r.status == 401


def test_guest_projects_list_is_401_without_body(scn):
    r = scn.client("A").get("/projects/")
    assert r.status == 401 and r.content == b""
