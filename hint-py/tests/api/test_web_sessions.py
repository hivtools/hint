"""How long a session lasts, and what is kept of it (app/services/web_sessions.py)."""

import hashlib
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta

import httpx2
import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine

from app import clock as app_clock
from app.db.models import WebSession
from app.main import app
from app.services.web_sessions import COOKIE_NAME
from tests.support import USER

START = datetime(2026, 11, 1, 9, 0, tzinfo=UTC)


class Clock:
    def __init__(self):
        self.now = START

    def move(self, **kwargs):
        self.now += timedelta(**kwargs)


@pytest.fixture
def clock(monkeypatch: pytest.MonkeyPatch) -> Clock:
    clock = Clock()
    monkeypatch.setattr(app_clock, "utc_now", lambda: clock.now)
    return clock


@pytest_asyncio.fixture
async def browser(settings_overrides: dict) -> AsyncIterator[httpx2.AsyncClient]:
    settings_overrides.update(environment="development", dev_users=[USER])
    transport = httpx2.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx2.AsyncClient(transport=transport, base_url="http://localhost:8080") as b:
        yield b


async def user_of(browser: httpx2.AsyncClient) -> str:
    return (await browser.get("/me")).json()["data"]["user"]


async def rows(engine: AsyncEngine) -> list:
    async with engine.connect() as conn:
        return list((await conn.execute(select(WebSession))).all())


async def test_only_the_hash_of_the_session_id_is_kept(browser, clock, engine):
    await browser.post("/dev-login", data={"user": USER})

    session_id = browser.cookies[COOKIE_NAME]
    [row] = await rows(engine)
    assert row.id_hash == hashlib.sha256(session_id.encode()).digest()
    assert session_id.encode() not in row.id_hash
    # secrets.token_urlsafe(32): 32 random bytes
    assert len(session_id) >= 43


async def test_each_login_gets_a_new_id(browser, clock):
    await browser.post("/dev-login", data={"user": USER})
    first = browser.cookies[COOKIE_NAME]

    await browser.post("/dev-login", data={"user": USER})

    assert browser.cookies[COOKIE_NAME] != first


async def test_a_login_lasts_7_days_after_its_last_use(browser, clock):
    await browser.post("/dev-login", data={"user": USER})

    clock.move(days=6, hours=23)
    assert await user_of(browser) == USER
    clock.move(days=6, hours=23)
    assert await user_of(browser) == USER
    clock.move(days=7, minutes=1)
    assert await user_of(browser) == "guest"


async def test_a_login_lasts_30_days_at_most_however_much_it_is_used(browser, clock):
    await browser.post("/dev-login", data={"user": USER})

    for _ in range(29):
        clock.move(days=1)
        assert await user_of(browser) == USER
    clock.move(days=1)
    assert await user_of(browser) == "guest"


async def test_a_guest_session_lasts_24_hours_after_its_last_use(browser, clock):
    version = (await browser.post("/guest/version")).json()["data"]["id"]

    clock.move(hours=23)
    assert (await browser.get("/items/whoami")).json()["guest_version_ids"] == [version]
    clock.move(hours=24, minutes=1)
    assert (await browser.get("/items/whoami")).json()["guest_version_ids"] == []


async def test_the_expiry_is_moved_at_most_every_5_minutes(browser, clock, engine):
    await browser.post("/dev-login", data={"user": USER})
    [before] = await rows(engine)

    clock.move(minutes=4)
    r = await browser.get("/me")
    assert "set-cookie" not in r.headers
    assert (await rows(engine))[0].expires_at == before.expires_at

    clock.move(minutes=2)
    r = await browser.get("/me")
    # A logged in user's cookie is sent again, so the browser keeps it 7 more days too
    assert f"Max-Age={7 * 24 * 3600}" in r.headers["set-cookie"]
    [after] = await rows(engine)
    assert after.expires_at.replace(tzinfo=UTC) == START + timedelta(minutes=6, days=7)


async def test_a_guest_cookie_is_not_sent_again(browser, clock):
    await browser.post("/guest/version")

    clock.move(hours=1)
    r = await browser.get("/me")

    # The browser forgets it when it closes, so there is nothing to move on
    assert "set-cookie" not in r.headers


async def test_an_ended_session_stays_ended_even_if_its_row_is_still_there(browser, clock, engine):
    await browser.post("/dev-login", data={"user": USER})

    clock.move(days=8)

    assert await user_of(browser) == "guest"
    assert len(await rows(engine)) == 1
