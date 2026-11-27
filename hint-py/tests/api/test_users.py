"""GET /user/{email}/exists and POST /guest/version (app/routers/users.py)."""

import httpx2
import pytest
from sqlalchemy import insert

from app.db.models import User
from tests.api.helpers import assert_failure, make_client
from tests.support import USER

# Not USER or OTHER_USER: the test client logs the address it calls, and the tests fail if one of those is in a log
# (see `no_personal_data_in_logs`). The API's own access log has no email (app/logging_setup.py).
SHARED_WITH = "shared.with@example.com"


@pytest.fixture
async def shared_with(engine):
    async with engine.begin() as conn:
        await conn.execute(insert(User).values(id=SHARED_WITH, username=SHARED_WITH))


@pytest.mark.parametrize("email", [SHARED_WITH, SHARED_WITH.upper()])
async def test_a_user_that_exists(api: httpx2.AsyncClient, shared_with, email: str):
    r = await api.get(f"/user/{email}/exists")

    assert r.status_code == 200
    assert r.json() == {"status": "success", "errors": [], "data": True}


async def test_a_user_that_does_not_exist(api: httpx2.AsyncClient):
    r = await api.get("/user/nobody@example.com/exists")

    assert r.json()["data"] is False


async def test_the_email_must_be_an_email(api: httpx2.AsyncClient):
    r = await api.get("/user/nobody/exists")

    assert_failure(r, 400, "Please provide a valid email address.")


async def test_a_guest_may_not_ask(anonymous_client: httpx2.AsyncClient):
    r = await anonymous_client.get(f"/user/{SHARED_WITH}/exists")

    assert_failure(r, 401, "Login required")


async def test_a_new_guest_is_given_a_version_and_a_session(anonymous_client: httpx2.AsyncClient):
    r = await anonymous_client.post("/guest/version")

    assert r.status_code == 200
    version = r.json()["data"]
    assert set(version) == {"id", "created", "updated", "versionNumber", "note"}
    assert "hint_session" in r.headers["set-cookie"]
    whoami = (await anonymous_client.get("/items/whoami")).json()
    assert whoami["guest_version_ids"] == [version["id"]]


async def test_a_guest_may_use_the_versions_they_were_given(anonymous_client: httpx2.AsyncClient, hintr):
    first = (await anonymous_client.post("/guest/version")).json()["data"]["id"]
    second = (await anonymous_client.post("/guest/version")).json()["data"]["id"]

    assert first != second
    for version in (first, second):
        r = await anonymous_client.get("/baseline/pjnz", headers={"X-Version-Id": version})
        assert r.status_code == 200


async def test_a_guest_may_not_use_another_guests_version(anonymous_client: httpx2.AsyncClient):
    version = (await anonymous_client.post("/guest/version")).json()["data"]["id"]

    async with make_client("guest") as other_guest:
        r = await other_guest.get("/baseline/pjnz", headers={"X-Version-Id": version})

    assert r.status_code == 403


async def test_a_logged_in_user_may_not_ask_for_a_guest_version(api: httpx2.AsyncClient):
    r = await api.post("/guest/version")

    assert_failure(r, 403, "Only guests can create a guest version.")


async def test_the_session_of_a_user_who_is_not_a_guest_is_not_changed(api: httpx2.AsyncClient):
    await api.post("/guest/version")

    async with make_client(USER) as again:
        assert (await again.get("/items/whoami")).json()["guest_version_ids"] == []


async def test_every_guest_version_is_version_1(anonymous_client: httpx2.AsyncClient):
    # A guest's versions are in no project, so none comes after another (as in Kotlin): two tabs, and another guest
    first = (await anonymous_client.post("/guest/version")).json()["data"]
    second = (await anonymous_client.post("/guest/version")).json()["data"]
    async with make_client("guest") as other_guest:
        other = (await other_guest.post("/guest/version")).json()["data"]

    assert [first["versionNumber"], second["versionNumber"], other["versionNumber"]] == [1, 1, 1]
