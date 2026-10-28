from collections.abc import AsyncIterator

import httpx
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncEngine

from app.db.database import create_db_session_factory
from app.main import app
from tests.api.helpers import make_client
from tests.support import OTHER_USER, USER


@pytest_asyncio.fixture
async def api(engine: AsyncEngine) -> AsyncIterator[httpx.AsyncClient]:
    """The app (on the test database) as USER."""
    app.state.db_session_factory = create_db_session_factory(engine)
    async with make_client(USER) as client:
        yield client


@pytest_asyncio.fixture
async def other_api(api: httpx.AsyncClient) -> AsyncIterator[httpx.AsyncClient]:
    """The same app as OTHER_USER."""
    async with make_client(OTHER_USER) as client:
        yield client
