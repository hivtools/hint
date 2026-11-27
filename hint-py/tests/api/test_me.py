"""GET /me: who the Vue app is working for, and the title it shows."""

import httpx2

from tests.api.helpers import make_client
from tests.support import USER


async def test_me_gives_the_user_and_the_title(api: httpx2.AsyncClient):
    r = await api.get("/me")

    assert r.status_code == 200
    assert r.json() == {"status": "success", "errors": [], "data": {"user": USER, "title": "Naomi"}}


async def test_me_is_never_cached(api: httpx2.AsyncClient):
    # The answer depends on the cookie: a cache that kept it would give one user's name to another
    r = await api.get("/me")

    assert r.headers["cache-control"] == "no-store"


async def test_me_gives_a_guest_as_guest():
    async with make_client("guest") as guest:
        r = await guest.get("/me")

    assert r.status_code == 200
    assert r.json()["data"]["user"] == "guest"


async def test_me_gives_the_title_of_this_deployment(api: httpx2.AsyncClient, settings_overrides: dict):
    settings_overrides["application_title"] = "Naomi (test)"

    r = await api.get("/me")

    assert r.json()["data"]["title"] == "Naomi (test)"


async def test_me_needs_the_identity_from_the_proxy(anonymous_client: httpx2.AsyncClient):
    r = await anonymous_client.get("/me")

    assert r.status_code == 401
