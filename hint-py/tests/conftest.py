import logging
import os
from collections.abc import AsyncIterator, Iterator

import pytest
import pytest_asyncio
import structlog
from sqlalchemy import insert, text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool, StaticPool

from app.config import Settings
from app.db.database import create_db_session_factory
from app.db.models import Base, User
from app.logging_setup import UVICORN_LOGGERS, LogHandler, configure_logging
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


@pytest.fixture(autouse=True)
def isolated_logging() -> Iterator[None]:
    """Set up the logging before each test, and put it back after the test.

    `autouse` means that every test uses this fixture without asking for it.

    Why set it up: if `configure_logging` has not run, structlog prints to the screen and `logging` does not get the
    messages. `caplog` (pytest's tool to read the log messages of a test) reads from `logging`, so it would see nothing.
    Pytest also shows what is on stderr when a test fails.

    Why put it back: `configure_logging` changes the root logger, the uvicorn loggers and the structlog settings.
    These are global. If a test changed them and did not put them back, the next tests would see the change.
    """
    root = logging.getLogger()
    level = root.level
    uvicorn = {
        name: (list(logging.getLogger(name).handlers), logging.getLogger(name).propagate, logging.getLogger(name).level)
        for name in UVICORN_LOGGERS
    }
    configure_logging(Settings(log_level="INFO", log_format="console"))
    yield
    for handler in [h for h in root.handlers if isinstance(h, LogHandler)]:
        root.removeHandler(handler)
    root.setLevel(level)
    for name, (handlers, propagate, uvicorn_level) in uvicorn.items():
        logging.getLogger(name).handlers[:] = handlers
        logging.getLogger(name).propagate = propagate
        logging.getLogger(name).setLevel(uvicorn_level)
    structlog.reset_defaults()
