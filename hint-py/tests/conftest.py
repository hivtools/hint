import os
from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from sqlalchemy import insert, text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool, StaticPool

from app.db.database import create_db_session_factory
from app.db.models import Base, User
from tests.hintr import FakeHintr
from tests.support import OTHER_USER, USER

# Set this to run the tests on a real Postgres instead of in memory SQLite, for example
# postgresql+asyncpg://hintuser:changeme@localhost:55432/hint. It has to be a database that the Kotlin migrations have
# been run on (the tests use its real schema, triggers and defaults), and it is emptied before every test.
POSTGRES_URL = os.environ.get("HINT_TEST_DB_URL")
USERS = (USER, OTHER_USER, "guest")

_checked_postgres = False


async def _postgres_engine() -> AsyncEngine:
    global _checked_postgres
    engine = create_async_engine(POSTGRES_URL, poolclass=NullPool)  # ty: ignore[invalid-argument-type]
    async with engine.begin() as conn:
        if not _checked_postgres:
            projects = (await conn.execute(text("SELECT count(*) FROM project"))).scalar_one()
            if projects and not os.environ.get("HINT_TEST_DB_RESET"):
                pytest.exit(
                    f"HINT_TEST_DB_URL has {projects} projects. The tests empty it, set HINT_TEST_DB_RESET=1 to allow that",
                    returncode=4,
                )
            _checked_postgres = True
        await conn.execute(text("TRUNCATE version_file, project_version, project, file RESTART IDENTITY CASCADE"))
        for user in USERS:
            await conn.execute(
                text("INSERT INTO users (id, username) VALUES (:user, :user) ON CONFLICT DO NOTHING"), {"user": user}
            )
    return engine


@pytest_asyncio.fixture
async def engine() -> AsyncIterator[AsyncEngine]:
    """The database the tests run on: an empty in memory SQLite database with the tables created and the users that
    exist in a dev database, or a real Postgres if HINT_TEST_DB_URL is set.

    The default needs nothing installed, so the tests run on every OS in CI. It checks the queries and the mapping, not
    Postgres specifics (nor the trigger that sets `updated`, tests that need it set it themselves).
    """
    if POSTGRES_URL:
        engine = await _postgres_engine()
    else:
        engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            for user in USERS:
                await conn.execute(insert(User).values(id=user, username=user))
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def session(engine: AsyncEngine) -> AsyncIterator[AsyncSession]:
    async with create_db_session_factory(engine)() as db_session:
        yield db_session


@pytest_asyncio.fixture
async def hintr() -> AsyncIterator[FakeHintr]:
    """hintr, which records the calls it gets and answers as the test says (see tests/hintr.py)."""
    fake = FakeHintr()
    yield fake
    await fake.http.aclose()
