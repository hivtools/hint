"""Who the API takes a request to be from, through the whole app: the session cookie (app/services/web_sessions.py)."""

import httpx2

from tests.api.helpers import make_client
from tests.support import ADR_TOKEN, USER


async def test_whoami_reads_the_session():
    async with make_client(USER) as client:
        r = await client.get("/items/whoami")
    assert r.status_code == 200
    assert r.json() == {
        "user": USER,
        "version_id": None,
        "is_guest": False,
        "guest_version_ids": [],
        "has_access_token": False,
    }


async def test_whoami_reads_the_version_the_tab_is_working_on():
    async with make_client(USER, "v1") as client:
        r = await client.get("/items/whoami")
    assert r.json()["version_id"] == "v1"


async def test_a_blank_version_header_means_no_version():
    async with make_client(USER) as client:
        r = await client.get("/items/whoami", headers={"X-Version-Id": ""})
    assert r.json()["version_id"] is None


async def test_a_visitor_with_no_session_is_a_guest(anonymous_client: httpx2.AsyncClient):
    r = await anonymous_client.get("/items/whoami")
    assert r.json()["user"] == "guest"
    assert r.json()["is_guest"] is True
    assert r.json()["guest_version_ids"] == []


async def test_a_cookie_that_is_no_session_is_a_guest(anonymous_client: httpx2.AsyncClient):
    anonymous_client.cookies.set("hint_session", "made-up")
    r = await anonymous_client.get("/items/whoami")
    assert r.json()["is_guest"] is True


async def test_guest_versions_are_the_ones_the_server_gave_to_the_guest():
    async with make_client("guest", guest_versions=["v1", "v2"]) as guest:
        r = await guest.get("/items/whoami")
    assert r.json()["is_guest"] is True
    assert r.json()["guest_version_ids"] == ["v1", "v2"]


async def test_the_identity_headers_of_the_old_proxy_are_ignored(anonymous_client: httpx2.AsyncClient):
    # nginx used to ask Kotlin who the user was and send it in these. Now a client could send them itself
    r = await anonymous_client.get(
        "/items/whoami",
        headers={"X-Hint-User": USER, "X-Hint-Guest-Versions": "v1", "X-Hint-Access-Token": "a.b.c"},
    )
    assert r.json() == {
        "user": "guest",
        "version_id": None,
        "is_guest": True,
        "guest_version_ids": [],
        "has_access_token": False,
    }


async def test_the_access_token_of_an_sso_user_is_read_but_never_returned():
    async with make_client(USER, access_token=ADR_TOKEN) as client:
        r = await client.get("/items/whoami")
    assert r.json()["has_access_token"] is True
    assert ADR_TOKEN not in r.text


async def test_item_with_identity():
    async with make_client(USER) as client:
        r = await client.get("/items/1")
    assert r.status_code == 200
    assert r.json() == {"item_id": 1}
