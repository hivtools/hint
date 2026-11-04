from collections.abc import AsyncIterator

import httpx2
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncEngine

from app.db.database import create_db_session_factory
from app.main import app
from tests.api.helpers import make_client
from tests.hintr import FakeHintr
from tests.support import OTHER_USER, USER


@pytest_asyncio.fixture
async def api(engine: AsyncEngine) -> AsyncIterator[httpx2.AsyncClient]:
    """The app (on the test database) as USER."""
    app.state.db_session_factory = create_db_session_factory(engine)
    async with make_client(USER) as client:
        yield client


@pytest_asyncio.fixture
async def other_api(api: httpx2.AsyncClient) -> AsyncIterator[httpx2.AsyncClient]:
    """The same app as OTHER_USER."""
    async with make_client(OTHER_USER) as client:
        yield client


@pytest_asyncio.fixture
async def anonymous_client() -> AsyncIterator[httpx2.AsyncClient]:
    """The app with no identity headers and no database, for endpoints that need neither."""
    transport = httpx2.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx2.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def hintr(hintr: FakeHintr) -> FakeHintr:
    """The same hintr, now the one that the app calls."""
    app.state.hintr_http = hintr.http
    return hintr
