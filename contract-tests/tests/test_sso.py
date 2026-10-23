"""OAuth2 / SSO login against the stub IdP (TLS, see scripts/dev.sh test) and GitHub bearer protection of /model/debug.

The SUT runs with oauth2_login_method=false here (password login), but /oauth2, /register and the pac4j callback
are always active.  Tests that need oauth2_login_method=true are in test_sso_mode.py."""
from __future__ import annotations

import urllib.parse

import pytest

from hintcontract.controls import fault
from hintcontract.flows import TEST_USER, create_project, upload

SSO_USER = "sso.user@example.com"


def start(scn, a):
    r = a.get("/oauth2", name="start sso login", check_cookie=True)
    q = urllib.parse.parse_qs(urllib.parse.urlsplit(r.headers["location"]).query)
    return q["state"][0]


def callback(a, state, code="the-code", **kw):
    params = {"code": code}
    if state is not None:
        params["state"] = state
    return a.get("/callback/oauth2Client", params=params, **kw)


@pytest.mark.quirk
def test_sso_login_creates_user_and_session(scn):
    """quirk: the redirect_uri sent to the IdP token endpoint has the client name twice
    (`/callback/oauth2Client/oauth2Client`, see the recorded idp call)."""
    scn.set_stub(idp={"userinfo": {"email": SSO_USER}})
    a = scn.client("A")
    state = start(scn, a)
    r = callback(a, state, name="callback with correct state")
    assert r.status in (302, 303), r.text
    a.get("/", name="logged in as sso user", html_checks=[f'currentUser = "{SSO_USER}"'])
    a.get("/projects/", name="projects list works")
    scn.db_rows("users")


def test_sso_login_existing_user_is_not_duplicated(scn):
    scn.set_stub(idp={"userinfo": {"email": TEST_USER}})
    a = scn.client("A")
    callback(a, start(scn, a))
    a.get("/", html_checks=[f'currentUser = "{TEST_USER}"'], name="logged in as the existing user")
    create_project(a, "via sso")
    scn.db_rows("users")
    scn.db_rows("project")


@pytest.mark.quirk
def test_sso_login_with_different_case_email_matches_user_but_keeps_idp_case(scn):
    """quirk: the existing user is found case-insensitively, but the session id is the IdP's spelling, so creating a
    project then fails the foreign key on users.id."""
    scn.set_stub(idp={"userinfo": {"email": TEST_USER.upper()}})
    a = scn.client("A")
    callback(a, start(scn, a))
    a.get("/", html_checks=[f'currentUser = "{TEST_USER.upper()}"'], name="session user id")
    a.open_app()
    create_project(a, "p")
    scn.db_rows("users")


def test_sso_state_errors(scn):
    scn.set_stub(idp={"userinfo": {"email": SSO_USER}})
    a = scn.client("A")
    state = start(scn, a)
    callback(a, "wrong-state", name="state mismatch")
    callback(a, None, name="state missing")
    a.get("/callback/oauth2Client", name="no parameters at all")
    a.get("/callback/oauth2Client", params={"state": state}, name="state but no code")
    callback(scn.client("B"), state, name="correct state but in a different session")
    scn.db_rows("users")


def test_sso_state_is_single_use_per_login_start(scn):
    scn.set_stub(idp={"userinfo": {"email": SSO_USER}})
    a = scn.client("A")
    s1 = start(scn, a)
    s2 = start(scn, a)
    callback(a, s1, name="state of the first start is superseded")
    callback(a, s2, name="latest state works")


def test_sso_idp_failures(scn):
    a = scn.client("A")
    state = start(scn, a)
    cases = {
        "token endpoint 400": {"idp": {"token_status": 400, "token": {"error": "invalid_grant"}}},
        "token endpoint 500": {"idp": {"token_status": 500, "token": {"error": "boom"}}},
        "token response without access_token": {"idp": {"token": {"token_type": "Bearer"}}},
        "userinfo 401": {"idp": {"userinfo_status": 401, "userinfo": {"error": "nope"}}},
        "userinfo without email": {"idp": {"userinfo": {"name": "No Email"}}},
        "userinfo email not an email": {"idp": {"userinfo": {"email": "not-an-email"}}},
        "userinfo with null email": {"idp": {"userinfo": {"email": None}}},
    }
    for label, st in cases.items():
        scn.set_stub(**st)
        a.get("/oauth2", name=f"restart ({label})")
        s = urllib.parse.parse_qs(urllib.parse.urlsplit(a.raw.send("GET", "/oauth2").headers["location"]).query)["state"][0]
        # the extra raw send above only refreshes the state used in the next call
        callback(a, s, name=label)
    a.get("/projects/", name="never logged in")
    scn.db_rows("users")


def test_sso_logout_redirects_to_idp(scn):
    scn.set_stub(idp={"userinfo": {"email": SSO_USER}})
    a = scn.client("A")
    callback(a, start(scn, a))
    r = a.get("/logout", name="logout of an sso session")
    assert r.status in (302, 303)
    a.get("/projects/", name="logged out")


# ---------------------------------------------------------------------------------------------- github bearer
@pytest.mark.quirk
def test_model_debug_requires_a_github_bearer_token(scn, pipeline):
    """quirk: besides a GitHub bearer token (needs network egress, not tested), an ordinary logged-in session also
    passes the /model/debug interceptor."""
    pipeline.bind(scn)
    a = scn.client("A")
    a.get(f"/model/debug/{pipeline.fit_id}", name="no authorization header")
    a.get(f"/model/debug/{pipeline.fit_id}", headers={"Authorization": "Basic dXNlcjpwYXNz"}, name="basic auth")
    a.get(f"/model/debug/{pipeline.fit_id}", headers={"Authorization": "Bearer"}, name="bearer without token")
    a.get(f"/model/debug/{pipeline.fit_id}", headers={"Authorization": "Token abc"}, name="wrong scheme")
    a.login()
    # hintr answers 400 "Copying <files> failed" (the file list is in database order, so the text is not recorded)
    r = a.get(f"/model/debug/{pipeline.fit_id}", name="a logged in session is not enough", ignore_body=True)
    assert r.status == 400 and "Copying" in r.text
    a.get("/model/debug/", name="no id")
