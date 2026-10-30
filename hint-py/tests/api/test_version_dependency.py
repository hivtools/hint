"""`current_version_id`: the version a request works on is only used if the user may use it.

No endpoint uses it yet, so this tests it on a route of its own, on the same database as the real app.
"""

from collections.abc import AsyncIterator
from typing import Annotated

import httpx2
import pytest
import pytest_asyncio
from fastapi import Depends, FastAPI
from sqlalchemy.ext.asyncio import AsyncEngine

from app.db.database import create_db_session_factory
from app.dependencies import current_version_id
from app.errors import register_error_handlers
from tests.api.helpers import create_project
from tests.support import OTHER_USER, USER

INVALID_VERSION = {
    "data": {},
    "errors": [{"error": "INVALID_VERSION", "detail": "The version cannot be used by this user."}],
    "status": "failure",
}


@pytest_asyncio.fixture
async def version_app(engine: AsyncEngine) -> AsyncIterator[FastAPI]:
    app = FastAPI()
    app.state.db_session_factory = create_db_session_factory(engine)
    register_error_handlers(app)

    @app.get("/on-a-version")
    async def on_a_version(version_id: Annotated[str, Depends(current_version_id)]):
        return {"version_id": version_id}

    yield app


def client_of(app: FastAPI, user: str, version_id: str | None = None, guest_versions: str | None = None):
    headers = {"X-Hint-User": user}
    if version_id is not None:
        headers["X-Version-Id"] = version_id
    if guest_versions is not None:
        headers["X-Hint-Guest-Versions"] = guest_versions
    transport = httpx2.ASGITransport(app=app, raise_app_exceptions=False)
    return httpx2.AsyncClient(transport=transport, base_url="http://test", headers=headers)


async def test_a_user_may_use_a_version_of_their_project(api, version_app):
    version_id = (await create_project(api))["versions"][0]["id"]
    async with client_of(version_app, USER, version_id) as client:
        r = await client.get("/on-a-version")
    assert r.status_code == 200
    assert r.json() == {"version_id": version_id}


async def test_a_user_may_not_use_a_version_of_somebody_elses_project(api, version_app):
    version_id = (await create_project(api))["versions"][0]["id"]
    async with client_of(version_app, OTHER_USER, version_id) as client:
        r = await client.get("/on-a-version")
    assert r.status_code == 403
    assert r.json() == INVALID_VERSION


async def test_a_user_may_not_use_a_version_that_does_not_exist(version_app):
    async with client_of(version_app, USER, "no-such-version") as client:
        r = await client.get("/on-a-version")
    assert r.status_code == 403
    assert r.json() == INVALID_VERSION


@pytest.mark.parametrize("user", [USER, "guest"])
async def test_no_version_at_all_is_refused(version_app, user):
    async with client_of(version_app, user) as client:
        assert (await client.get("/on-a-version")).json() == INVALID_VERSION
    async with client_of(version_app, user, "") as client:
        assert (await client.get("/on-a-version")).json() == INVALID_VERSION


async def test_a_guest_may_use_a_version_the_server_gave_to_them(version_app):
    async with client_of(version_app, "guest", "g2", guest_versions="g1,g2") as client:
        r = await client.get("/on-a-version")
    assert r.status_code == 200
    assert r.json() == {"version_id": "g2"}


async def test_a_guest_may_not_use_a_version_the_server_did_not_give_to_them(version_app):
    async with client_of(version_app, "guest", "g3", guest_versions="g1,g2") as client:
        assert (await client.get("/on-a-version")).json() == INVALID_VERSION
    async with client_of(version_app, "guest", "g1") as client:
        assert (await client.get("/on-a-version")).json() == INVALID_VERSION


async def test_a_guest_may_not_use_a_version_of_a_project(api, version_app):
    version_id = (await create_project(api))["versions"][0]["id"]
    async with client_of(version_app, "guest", version_id, guest_versions="g1") as client:
        assert (await client.get("/on-a-version")).json() == INVALID_VERSION


async def test_a_logged_in_user_may_not_use_a_version_just_because_a_guest_header_names_it(version_app):
    async with client_of(version_app, USER, "g1", guest_versions="g1") as client:
        assert (await client.get("/on-a-version")).json() == INVALID_VERSION


async def test_the_error_is_translated(version_app):
    async with client_of(version_app, USER, "no-such-version") as client:
        r = await client.get("/on-a-version", headers={"Accept-Language": "fr"})
    assert r.json()["errors"][0]["detail"] == "Cet utilisateur ne peut pas utiliser cette version."
