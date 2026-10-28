from collections.abc import AsyncIterator

import pytest_asyncio
from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.database import create_db_session_factory
from app.db.models import Base, User
from tests.support import OTHER_USER, USER


@pytest_asyncio.fixture
async def engine() -> AsyncIterator[AsyncEngine]:
    """An empty in memory SQLite database with the tables created and the users that exist in a dev database.

    The tests run on every OS in CI without a Postgres, so they check the queries and mapping, not Postgres specifics
    (nor the trigger that sets `updated`, tests that need it set it themselves).
    """
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for user in (USER, OTHER_USER, "guest"):
            await conn.execute(insert(User).values(id=user, username=user))
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def session(engine: AsyncEngine) -> AsyncIterator[AsyncSession]:
    async with create_db_session_factory(engine)() as db_session:
        yield db_session
