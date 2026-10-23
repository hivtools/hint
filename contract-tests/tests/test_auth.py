"""Password login, logout, forgot/reset password, SSO redirects."""
from __future__ import annotations

import time
import urllib.parse

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from hintcontract.flows import TEST_USER, upload

BAD = "badpassword"


def test_login_success_redirects_to_root_and_sets_session(scn):
    a = scn.client("A")
    r = a.login(check_cookie=True)
    assert r.status == 303
    a.get("/projects/", name="session now authenticated")
    a.get("/project/current", name="current project is null before any project")


def test_login_wrong_password(scn):
    a = scn.client("A")
    r = a.login(password=BAD)
    assert r.status == 303 and "BadCredentialsException" in r.headers["location"]
    a.get("/projects/", name="still a guest")


def test_login_unknown_user(scn):
    scn.client("A").login("nobody@example.com", "password")


def test_login_blank_username_and_password(scn):
    a = scn.client("A")
    a.login("", "password", name="blank username")
    a.login(TEST_USER, "", name="blank password")
    a.post("/callback/formClient", form={}, name="no credentials at all")


def test_login_username_is_case_insensitive(scn):
    a = scn.client("A")
    a.login("TEST.USER@EXAMPLE.COM", "password")
    a.get("/projects/", name="authenticated?")


@pytest.mark.quirk
def test_login_get_on_callback_without_credentials(scn):
    """quirk: GET /callback/formClient (no credentials) is accepted by pac4j and redirects back to login."""
    scn.client("A").get("/callback/formClient", name="GET callback without credentials")


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
    a.get("/baseline/pjnz/", name="file visible after login")
    a.get("/project/current", name="version is not in a project")


def test_second_login_replaces_first_user_in_same_session(scn):
    a = scn.client("A")
    a.login()
    a.get("/", html_checks=[f'currentUser = "{TEST_USER}"'], name="user 1")
    a.login("naomi-support@imperial.ac.uk", "password", name="login as second user")
    a.get("/", html_checks=['currentUser = "naomi-support@imperial.ac.uk"'], name="user 2")


# ----------------------------------------------------------------------------------------------------------------
# forgot / reset password
# ----------------------------------------------------------------------------------------------------------------
def _request_link(a, email, **kw):
    return a.post("/password/request-reset-link", form={"email": email}, name=kw.pop("name", f"request link {email}"), **kw)


@pytest.mark.quirk
def test_password_endpoints_answer_text_plain_with_a_json_body(scn):
    """quirk: POST /password/request-reset-link and /password/reset-password return their JSON as text/plain."""
    a = scn.client("A")
    r = a.post("/password/request-reset-link", form={"email": TEST_USER}, name="request link")
    assert r.content_type.startswith("text/plain")
    r = a.post("/password/reset-password", form={"token": "x", "password": "toolong-enough"}, name="reset with bad token")
    assert r.content_type.startswith("application/json")      # errors go through the exception handler


def test_forgot_password_pages(scn):
    a = scn.client("A")
    a.get("/password/forgot-password", html_checks=["forgotPasswordApp"])
    a.get("/password/reset-password", params={"token": "abc"}, html_checks=["data-token=\"abc\""],
          name="reset page shows the token")
    a.get("/password/reset-password", name="reset page without token")


def test_request_reset_link_known_user_writes_email(scn):
    a = scn.client("A")
    r = _request_link(a, TEST_USER)
    assert r.status == 200
    scn.emails("reset email")
    scn.db_rows("onetime_token")


def test_request_reset_link_unknown_user_gives_same_answer_and_no_email(scn):
    a = scn.client("A")
    _request_link(a, "unknown.person@example.com")
    assert scn.emails("no email for unknown user") == []


def test_request_reset_link_email_is_case_insensitive(scn):
    a = scn.client("A")
    _request_link(a, TEST_USER.upper())
    assert len(scn.emails("email sent")) == 1


def test_request_reset_link_invalid_email(scn):
    a = scn.client("A")
    _request_link(a, "not-an-email", name="no @ sign")
    _request_link(a, "", name="empty email")
    a.post("/password/request-reset-link", name="missing parameter")
    a.post("/password/request-reset-link", form={"email": "x"}, headers={"Accept-Language": "fr"}, name="french")
    assert scn.emails("no emails", quiet=True) == []


def test_reset_password_end_to_end_and_token_is_single_use(scn):
    a = scn.client("A")
    _request_link(a, TEST_USER)
    token = scn.last_email_token()
    r = a.post("/password/reset-password", form={"token": token, "password": "newpassword"}, name="reset password")
    assert r.status == 200
    a.post("/password/reset-password", form={"token": token, "password": "another-one"}, name="reuse token")
    a.login(password="password", name="old password no longer works")
    a.login(password="newpassword", name="new password works")
    a.get("/projects/", name="authenticated")
    scn.db_rows("onetime_token")


def test_reset_password_too_short_does_not_consume_token(scn):
    a = scn.client("A")
    _request_link(a, TEST_USER)
    token = scn.last_email_token()
    a.post("/password/reset-password", form={"token": token, "password": "short"}, name="5 chars")
    a.post("/password/reset-password", form={"token": token, "password": "123456"}, name="exactly 6 chars")
    a.login(password="123456", name="login with 6 char password")


def test_reset_password_length_is_checked_before_token(scn):
    a = scn.client("A")
    a.post("/password/reset-password", form={"token": "garbage", "password": "x"}, name="short password + bad token")


def test_reset_password_invalid_tokens(scn):
    a = scn.client("A")
    a.post("/password/reset-password", form={"token": "blah", "password": "newpassword"}, name="garbage token")
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    now = 4102444800   # fixed (year 2100) so the forged tokens are reproducible
    forged = jwt.encode({"iss": "mrc-ide", "sub": TEST_USER, "exp": now + 3600, "nonce": "x"}, key, algorithm="RS256")
    a.post("/password/reset-password", form={"token": forged, "password": "newpassword"},
           name="well-formed token signed with another key")
    unsigned = jwt.encode({"iss": "mrc-ide", "sub": TEST_USER, "exp": now + 3600}, None, algorithm="none")
    a.post("/password/reset-password", form={"token": unsigned, "password": "newpassword"}, name="alg=none token")
    a.post("/password/reset-password", form={"token": "", "password": "newpassword"}, name="empty token")
    a.login(password="newpassword", name="password unchanged")


def test_reset_password_invalid_token_message_is_translated(scn):
    a = scn.client("A")
    for lang in ("fr", "pt", "en", "de"):
        a.post("/password/reset-password", form={"token": "blah", "password": "newpassword"},
               headers={"Accept-Language": lang}, name=f"invalid token in {lang}")
        a.post("/password/reset-password", form={"token": "blah", "password": "x"},
               headers={"Accept-Language": lang}, name=f"short password in {lang}")


def test_reset_password_missing_parameters(scn):
    a = scn.client("A")
    a.post("/password/reset-password", form={"password": "newpassword"}, name="missing token")
    a.post("/password/reset-password", form={"token": "abc"}, name="missing password")
    a.post("/password/reset-password", name="nothing")


def test_reset_token_for_one_user_does_not_affect_another(scn):
    a = scn.client("A")
    _request_link(a, "naomi-support@imperial.ac.uk")
    token = scn.last_email_token()
    a.post("/password/reset-password", form={"token": token, "password": "supportpw"}, name="reset support user")
    a.login(password="password", name="test user unaffected")
    b = scn.client("B")
    b.login("naomi-support@imperial.ac.uk", "supportpw", name="support user with new password")


# ----------------------------------------------------------------------------------------------------------------
# SSO redirects (the IdP itself is stubbed in test_sso.py)
# ----------------------------------------------------------------------------------------------------------------
def _location_query(r):
    return urllib.parse.parse_qs(urllib.parse.urlsplit(r.headers["location"]).query)


def test_oauth2_redirect_to_idp_authorize(scn):
    a = scn.client("A")
    r = a.get("/oauth2", check_cookie=True)
    assert r.status == 303
    q = _location_query(r)
    assert q["response_type"] == ["code"] and q["state"][0]


def test_register_redirect_has_signup_hint(scn):
    a = scn.client("A")
    r = a.get("/register", check_cookie=True)
    assert r.status == 303
    assert _location_query(r)["screen_hint"] == ["signup"]


def test_oauth2_state_changes_every_call(scn):
    a = scn.client("A")
    s1 = _location_query(a.get("/oauth2"))["state"]
    s2 = _location_query(a.get("/oauth2"))["state"]
    assert s1 != s2
