"""Password login, logout, SSO redirects."""
from __future__ import annotations

import time
import urllib.parse

import pytest

from hintcontract.flows import TEST_USER, upload

BAD = "badpassword"


@pytest.mark.kotlin_login
def test_login_success_redirects_to_root_and_sets_session(scn):
    a = scn.client("A")
    r = a.login(check_cookie=True)
    assert r.status == 303
    a.get("/projects/", name="session now authenticated")
    a.get("/project/current", name="current project is null before any project")


@pytest.mark.kotlin_login
def test_login_wrong_password(scn):
    a = scn.client("A")
    r = a.login(password=BAD)
    assert r.status == 303 and "BadCredentialsException" in r.headers["location"]
    a.get("/projects/", name="still a guest")


@pytest.mark.kotlin_login
def test_login_unknown_user(scn):
    scn.client("A").login("nobody@example.com", "password")


@pytest.mark.kotlin_login
def test_login_blank_username_and_password(scn):
    a = scn.client("A")
    a.login("", "password", name="blank username")
    a.login(TEST_USER, "", name="blank password")
    a.post("/callback/formClient", form={}, name="no credentials at all")


@pytest.mark.kotlin_login
def test_login_username_is_case_insensitive(scn):
    a = scn.client("A")
    a.login("TEST.USER@EXAMPLE.COM", "password")
    a.get("/projects/", name="authenticated?")


@pytest.mark.kotlin_login
@pytest.mark.quirk
def test_login_get_on_callback_without_credentials(scn):
    """quirk: GET /callback/formClient (no credentials) is accepted by pac4j and redirects back to login."""
    scn.client("A").get("/callback/formClient", name="GET callback without credentials")


@pytest.mark.kotlin_login
def test_login_with_redirect_to_goes_to_requested_url(scn):
    a = scn.client("A")
    a.get("/login", params={"redirectTo": "/projects"}, html_checks=["/projects"])
    r = a.login()
    assert r.status == 303


def test_logout_destroys_session_and_redirects_to_login(scn):
    a = scn.client("A")
    a.login()
    a.open_app()
    r = a.get("/logout", name="logout")
    assert r.status == 302
    a.get("/projects/", name="after logout the user is a guest")
    a.get("/project/current", name="secured prefix after logout")


def test_logout_as_guest(scn):
    scn.client("A").get("/logout")


def test_guest_session_files_survive_login(scn):
    """Files uploaded as guest are still attached to the session version after logging in."""
    a = scn.client("A")
    a.open_app()
    upload(a, "pjnz")
    a.login()
    a.get("/baseline/pjnz", name="file visible after login")
    a.get("/project/current", name="version is not in a project")


@pytest.mark.kotlin_login
def test_second_login_replaces_first_user_in_same_session(scn):
    a = scn.client("A")
    a.login()
    a.get("/", html_checks=[f'currentUser = "{TEST_USER}"'], name="user 1")
    a.login("naomi-support@imperial.ac.uk", "password", name="login as second user")
    a.get("/", html_checks=['currentUser = "naomi-support@imperial.ac.uk"'], name="user 2")


# ----------------------------------------------------------------------------------------------------------------
# SSO redirects (the IdP itself is stubbed in test_sso.py)
# ----------------------------------------------------------------------------------------------------------------
def _location_query(r):
    return urllib.parse.parse_qs(urllib.parse.urlsplit(r.headers["location"]).query)


@pytest.mark.kotlin_login
def test_oauth2_redirect_to_idp_authorize(scn):
    a = scn.client("A")
    r = a.get("/oauth2", check_cookie=True)
    assert r.status == 303
    q = _location_query(r)
    assert q["response_type"] == ["code"] and q["state"][0]


@pytest.mark.kotlin_login
def test_register_redirect_has_signup_hint(scn):
    a = scn.client("A")
    r = a.get("/register", check_cookie=True)
    assert r.status == 303
    assert _location_query(r)["screen_hint"] == ["signup"]


@pytest.mark.kotlin_login
def test_oauth2_state_changes_every_call(scn):
    a = scn.client("A")
    s1 = _location_query(a.get("/oauth2"))["state"]
    s2 = _location_query(a.get("/oauth2"))["state"]
    assert s1 != s2
