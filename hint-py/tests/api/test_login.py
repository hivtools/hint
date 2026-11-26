"""Logging in and out (app/routers/login.py): the login page, Auth0, the dev login, logout."""

from collections.abc import AsyncIterator
from urllib.parse import parse_qs, urlsplit

import httpx2
import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine

from app.db.models import User, WebSession
from app.main import app
from app.services.web_sessions import COOKIE_NAME
from tests.auth0 import CLIENT_ID, CLIENT_SECRET, CODE, DOMAIN, TOKEN
from tests.support import USER

APP_URL = "https://naomi.example"
SSO_USER = "sso.user@example.com"


def a_browser(base_url: str = APP_URL) -> httpx2.AsyncClient:
    """A browser: it keeps cookies, and does not follow redirects so that each can be checked."""
    transport = httpx2.ASGITransport(app=app, raise_app_exceptions=False)
    return httpx2.AsyncClient(transport=transport, base_url=base_url)


@pytest_asyncio.fixture
async def browser() -> AsyncIterator[httpx2.AsyncClient]:
    async with a_browser() as b:
        yield b


@pytest_asyncio.fixture
async def dev_browser(settings_overrides: dict) -> AsyncIterator[httpx2.AsyncClient]:
    """A browser on the dev stack, where the dev users log in without Auth0."""
    settings_overrides.update(
        environment="development", dev_users=[USER, "new.user@example.com"], application_url="http://localhost:8080"
    )
    async with a_browser("http://localhost:8080") as b:
        yield b


def query_of(url: str) -> dict[str, str]:
    return {k: v[0] for k, v in parse_qs(urlsplit(url).query).items()}


async def start_login(browser: httpx2.AsyncClient, path: str = "/oauth2") -> str:
    r = await browser.get(path)
    assert r.status_code == 303
    return query_of(r.headers["location"])["state"]


async def me(browser: httpx2.AsyncClient) -> str:
    return (await browser.get("/me")).json()["data"]["user"]


async def sessions_in_db(engine: AsyncEngine) -> list[WebSession]:
    async with engine.connect() as conn:
        return list((await conn.execute(select(WebSession))).all())


# ---- The login page


async def test_the_login_page_has_the_auth0_button_when_auth0_is_set_up(browser, auth0):
    r = await browser.get("/login")

    assert r.status_code == 200
    assert 'id="sso-login"' in r.text
    assert 'href="/oauth2"' in r.text
    assert "dev-login" not in r.text
    assert "Continue as guest" in r.text
    assert r.headers["cache-control"] == "no-store"


async def test_the_login_page_has_a_button_for_each_dev_user(dev_browser):
    r = await dev_browser.get("/login")

    assert 'action="/dev-login"' in r.text
    assert f'value="{USER}">Log in as {USER}' in r.text
    assert "Log in as new.user@example.com" in r.text
    assert "sso-login" not in r.text


async def test_the_login_page_has_no_password_form(browser, auth0):
    r = await browser.get("/login")

    assert 'type="password"' not in r.text
    assert "/callback/formClient" not in r.text


async def test_the_login_page_has_the_title_of_the_app(browser, auth0, settings_overrides):
    settings_overrides["application_title"] = "Naomi (test)"

    r = await browser.get("/login")

    assert "<strong>Naomi (test)</strong>" in r.text


@pytest.mark.parametrize(
    ("query", "shown"),
    [
        ({"error": "SessionExpired"}, "Your session expired. Please log in again"),
        ({"error": "SessionExpired", "message": "Custom expiry message"}, "Custom expiry message"),
    ],
)
async def test_the_login_page_says_when_a_session_has_expired(browser, auth0, query, shown):
    r = await browser.get("/login", params=query)

    assert f'<div id="error" class="alert alert-danger mt-2">{shown}</div>' in r.text


async def test_the_login_page_shows_no_error_otherwise(browser, auth0):
    r = await browser.get("/login", params={"error": "Anything"})

    assert 'id="error"' not in r.text


async def test_what_the_login_page_shows_from_the_query_is_escaped(browser, auth0):
    # Kotlin's page put the username from the query in the page as it was (quirk), Python's escapes all of it
    r = await browser.get("/login", params={"error": "SessionExpired", "message": "<b>x</b>"})

    assert "<b>x</b>" not in r.text
    assert "&lt;b&gt;x&lt;/b&gt;" in r.text


async def test_the_page_to_go_to_after_the_login_is_kept(browser, auth0):
    r = await browser.get("/login", params={"redirectTo": "/projects"})

    assert 'href="/projects">Continue as guest' in r.text
    assert 'href="/oauth2?redirectTo=%2Fprojects"' in r.text


@pytest.mark.parametrize("target", ["https://evil.example/", "//evil.example/", "/\\evil.example", "projects"])
async def test_the_login_never_sends_the_user_to_another_site(browser, auth0, target):
    r = await browser.get("/login", params={"redirectTo": target})

    assert 'href="/">Continue as guest' in r.text
    assert 'href="/oauth2"' in r.text


# ---- Login with Auth0


async def test_the_login_starts_at_auth0(browser, auth0):
    r = await browser.get("/oauth2")

    assert r.status_code == 303
    url = urlsplit(r.headers["location"])
    assert (url.scheme, url.netloc, url.path) == ("https", DOMAIN, "/authorize")
    query = query_of(r.headers["location"])
    assert query.pop("state")
    assert query == {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "scope": "openid profile email access:adr",
        "audience": "naomi",
        "redirect_uri": f"{APP_URL}/callback/oauth2Client",
    }


async def test_register_starts_at_auth0_on_the_sign_up_screen(browser, auth0):
    r = await browser.get("/register")

    assert query_of(r.headers["location"])["screen_hint"] == "signup"


async def test_the_start_gives_a_new_visitor_a_guest_session_for_the_state(browser, auth0, engine):
    r = await browser.get("/oauth2")

    cookie = r.headers["set-cookie"]
    assert cookie.startswith(f"{COOKIE_NAME}=")
    assert "HttpOnly" in cookie
    assert "Secure" in cookie
    assert "SameSite=lax" in cookie
    # Forgotten when the browser closes, as the visitor is not logged in yet
    assert "Max-Age" not in cookie
    [row] = await sessions_in_db(engine)
    assert row.user_id is None
    assert row.oauth_state == query_of(r.headers["location"])["state"]


async def test_a_login_with_auth0_logs_the_user_in(browser, auth0, engine):
    state = await start_login(browser)
    guest_cookie = browser.cookies[COOKIE_NAME]

    r = await browser.get("/callback/oauth2Client", params={"state": state, "code": CODE})

    assert r.status_code == 302
    assert r.headers["location"] == "/"
    # A new session id: the one from before the login is no use after it
    assert browser.cookies[COOKIE_NAME] != guest_cookie
    assert f"Max-Age={7 * 24 * 3600}" in r.headers["set-cookie"]
    assert await me(browser) == SSO_USER
    [row] = await sessions_in_db(engine)
    assert row.user_id == SSO_USER
    assert row.oauth_state is None


async def test_the_code_is_swapped_for_a_token_with_the_client_secret(browser, auth0):
    await browser.get("/callback/oauth2Client", params={"state": await start_login(browser), "code": CODE})

    token_call, userinfo_call = auth0.calls
    assert auth0.form_of(token_call) == {
        "grant_type": "authorization_code",
        "code": CODE,
        "redirect_uri": f"{APP_URL}/callback/oauth2Client",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }
    assert userinfo_call.headers["Authorization"] == f"Bearer {TOKEN}"


async def test_the_access_token_is_kept_to_call_adr_but_never_sent_to_the_browser(browser, auth0):
    r = await browser.get("/callback/oauth2Client", params={"state": await start_login(browser), "code": CODE})

    assert TOKEN not in r.text
    assert TOKEN not in str(r.headers)
    assert (await browser.get("/items/whoami")).json()["has_access_token"] is True


async def test_a_first_login_makes_the_user(browser, auth0, engine):
    await browser.get("/callback/oauth2Client", params={"state": await start_login(browser), "code": CODE})

    async with engine.connect() as conn:
        row = (await conn.execute(select(User).where(User.id == SSO_USER))).one()
    assert row.username == SSO_USER


async def test_an_existing_user_is_found_whatever_the_case_of_the_email(browser, auth0, engine):
    # Kotlin found the user too, but then used Auth0's spelling as the id, so the user's projects could not be made
    # (a foreign key error). Python uses the id of the user it found.
    auth0.email = USER.upper()

    await browser.get("/callback/oauth2Client", params={"state": await start_login(browser), "code": CODE})

    assert await me(browser) == USER
    async with engine.connect() as conn:
        assert (await conn.execute(select(User).where(User.username == USER.upper()))).all() == []


async def test_the_login_goes_back_to_the_page_it_was_asked_for(browser, auth0):
    state = query_of((await browser.get("/oauth2", params={"redirectTo": "/projects"})).headers["location"])["state"]

    r = await browser.get("/callback/oauth2Client", params={"state": state, "code": CODE})

    assert r.headers["location"] == "/projects"


async def test_a_callback_with_no_state_is_refused(browser, auth0):
    await start_login(browser)

    r = await browser.get("/callback/oauth2Client", params={"code": CODE})

    assert r.status_code == 400
    assert r.json()["errors"][0]["detail"] == "Auth0 state parameter must be provided"
    assert auth0.calls == []


async def test_a_callback_with_the_wrong_state_is_refused(browser, auth0):
    await start_login(browser)

    r = await browser.get("/callback/oauth2Client", params={"state": "wrong", "code": CODE})

    assert r.status_code == 400
    assert r.json()["errors"][0]["detail"].startswith("Auth0 State parameter mismatch")
    assert auth0.calls == []
    assert await me(browser) == "guest"


async def test_a_state_from_another_browser_is_refused(browser, auth0):
    state = await start_login(browser)

    async with a_browser() as other:
        r = await other.get("/callback/oauth2Client", params={"state": state, "code": CODE})

    assert r.status_code == 400
    assert auth0.calls == []


async def test_only_the_latest_start_can_finish(browser, auth0):
    first = await start_login(browser)
    latest = await start_login(browser)

    assert (await browser.get("/callback/oauth2Client", params={"state": first, "code": CODE})).status_code == 400
    assert (await browser.get("/callback/oauth2Client", params={"state": latest, "code": CODE})).status_code == 302


async def test_a_state_cannot_be_used_twice(browser, auth0):
    state = await start_login(browser)
    await browser.get("/callback/oauth2Client", params={"state": state, "code": CODE})

    r = await browser.get("/callback/oauth2Client", params={"state": state, "code": CODE})

    assert r.status_code == 400


async def test_a_callback_with_no_code_is_refused(browser, auth0):
    # Auth0 sends no code when the user does not let the app in. Kotlin sent the browser to / without a login.
    r = await browser.get(
        "/callback/oauth2Client", params={"state": await start_login(browser), "error": "access_denied"}
    )

    assert r.status_code == 400
    assert r.json()["errors"][0]["detail"] == "Auth0 did not send a login code. Please try to log in again."
    assert await me(browser) == "guest"


@pytest.mark.parametrize(
    "fault",
    [
        {"token_status": 400, "token_body": {"error": "invalid_grant"}},
        {"token_status": 500, "token_body": {"error": "boom"}},
        {"token_body": {"token_type": "Bearer"}},
        {"userinfo_status": 401},
        {"connect_error": True},
    ],
    ids=["token 400", "token 500", "no access_token", "userinfo 401", "no connection"],
)
async def test_when_auth0_fails_nobody_is_logged_in(browser, auth0, engine, fault):
    state = await start_login(browser)
    for name, value in fault.items():
        setattr(auth0, name, value)

    r = await browser.get("/callback/oauth2Client", params={"state": state, "code": CODE})

    # An unexpected error, as in Kotlin
    assert r.status_code == 500
    assert TOKEN not in r.text
    assert await me(browser) == "guest"
    async with engine.connect() as conn:
        assert (await conn.execute(select(User).where(User.id == SSO_USER))).all() == []


@pytest.mark.parametrize("email", [None, "not-an-email"])
async def test_a_user_without_an_email_is_not_logged_in(browser, auth0, email):
    auth0.email = email

    r = await browser.get("/callback/oauth2Client", params={"state": await start_login(browser), "code": CODE})

    assert r.status_code == 400
    assert r.json()["errors"][0]["detail"] == "Please provide a valid email address."
    assert await me(browser) == "guest"


# ---- Logout


async def test_logging_out_ends_the_auth0_session_too(browser, auth0, engine):
    await browser.get("/callback/oauth2Client", params={"state": await start_login(browser), "code": CODE})
    cookie = browser.cookies[COOKIE_NAME]

    r = await browser.get("/logout")

    assert r.status_code == 302
    url = urlsplit(r.headers["location"])
    assert (url.netloc, url.path) == (DOMAIN, "/v2/logout")
    assert query_of(r.headers["location"]) == {"client_id": CLIENT_ID, "returnTo": f"{APP_URL}/login"}
    assert await sessions_in_db(engine) == []
    # The cookie is gone from the browser, and the old one is no use either
    assert COOKIE_NAME not in browser.cookies
    browser.cookies.set(COOKIE_NAME, cookie)
    assert await me(browser) == "guest"


async def test_a_dev_user_logs_out_to_the_login_page(dev_browser):
    await dev_browser.post("/dev-login", data={"user": USER})

    r = await dev_browser.get("/logout")

    assert r.status_code == 302
    assert r.headers["location"] == "/login"
    assert await me(dev_browser) == "guest"


async def test_a_guest_logs_out_to_the_login_page(browser, auth0):
    r = await browser.get("/logout")

    assert r.status_code == 302
    assert r.headers["location"] == "/login"


# ---- The dev login


async def test_a_dev_user_logs_in_with_one_click(dev_browser):
    r = await dev_browser.post("/dev-login", data={"user": USER})

    assert r.status_code == 303
    assert r.headers["location"] == "/"
    # The dev stack is on http, so the cookie cannot be Secure there
    assert "Secure" not in r.headers["set-cookie"]
    assert await me(dev_browser) == USER


async def test_the_dev_login_makes_a_user_who_does_not_exist(dev_browser, engine):
    await dev_browser.post("/dev-login", data={"user": "new.user@example.com"})

    assert await me(dev_browser) == "new.user@example.com"


async def test_the_dev_login_goes_back_to_the_page_it_was_asked_for(dev_browser):
    r = await dev_browser.post("/dev-login", data={"user": USER, "redirectTo": "/projects"})

    assert r.headers["location"] == "/projects"


async def test_the_dev_login_is_only_for_the_dev_users(dev_browser):
    r = await dev_browser.post("/dev-login", data={"user": "someone.else@example.com"})

    assert r.status_code == 400
    assert await me(dev_browser) == "guest"


async def test_there_is_no_dev_login_without_dev_users(browser, auth0):
    r = await browser.post("/dev-login", data={"user": USER})

    assert r.status_code == 404
    assert await me(browser) == "guest"


async def test_a_login_ends_the_guest_session_and_its_versions(dev_browser, engine):
    version = (await dev_browser.post("/guest/version")).json()["data"]["id"]

    await dev_browser.post("/dev-login", data={"user": USER})

    [row] = await sessions_in_db(engine)
    assert row.user_id == USER
    r = await dev_browser.get("/model/options", headers={"X-Version-Id": version})
    assert r.status_code == 403
