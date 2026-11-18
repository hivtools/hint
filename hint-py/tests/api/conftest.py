"""The app of each test, and clients of it.

Each test has its own app (`app`), made with its own settings (`settings`), on the test database and calling the fake
hintr and ADR of the test. So nothing that a test changes reaches another test.
"""

from collections.abc import AsyncIterator
from pathlib import Path

import httpx2
import pytest
import pytest_asyncio
from fastapi import FastAPI
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncEngine

from app.config import Settings
from app.db.database import create_db_session_factory
from app.main import create_app
from tests.adr import FakeAdr
from tests.api.helpers import create_project, make_client
from tests.hintr import FakeHintr
from tests.support import ADR_KEY, OTHER_USER, USER


@pytest.fixture
def settings() -> Settings:
    """The settings of the app: the defaults, which fixtures and tests change (see `results_dir`).

    The app reads them each time it answers a request, so a change made after the app was made still counts.
    """
    return Settings()


@pytest.fixture
def app(settings: Settings, engine: AsyncEngine, hintr: FakeHintr, adr: FakeAdr) -> FastAPI:
    """The app, on the test database, calling the fake hintr and ADR of the test."""
    return create_app(
        settings, db_session_factory=create_db_session_factory(engine), hintr_http=hintr.http, adr_http=adr.http
    )


@pytest_asyncio.fixture
async def api(app: FastAPI) -> AsyncIterator[httpx2.AsyncClient]:
    """The app as USER."""
    async with make_client(app, USER) as client:
        yield client


@pytest_asyncio.fixture
async def version_id(api: httpx2.AsyncClient) -> str:
    """A version of a project of USER."""
    return (await create_project(api))["versions"][0]["id"]


@pytest_asyncio.fixture
async def on_a_version(app: FastAPI, version_id: str) -> AsyncIterator[httpx2.AsyncClient]:
    """USER, working on `version_id`."""
    async with make_client(app, USER, version_id) as client:
        yield client


@pytest_asyncio.fixture
async def other_api(app: FastAPI) -> AsyncIterator[httpx2.AsyncClient]:
    """The same app as OTHER_USER."""
    async with make_client(app, OTHER_USER) as client:
        yield client


@pytest_asyncio.fixture
async def anonymous_client(app: FastAPI) -> AsyncIterator[httpx2.AsyncClient]:
    """The app with no identity headers, for endpoints that need none."""
    transport = httpx2.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx2.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
def results_dir(tmp_path: Path, settings: Settings) -> Path:
    """An empty folder that the app reads hintr's results from, as it would the share they are written to."""
    folder = tmp_path / "results"
    folder.mkdir()
    settings.results_dir = str(folder)
    return folder


@pytest.fixture
def uploads_dir(tmp_path: Path, settings: Settings) -> Path:
    """An empty folder. The app writes the uploaded files here and tells hintr that the files are here."""
    folder = tmp_path / "uploads"
    folder.mkdir()
    settings.upload_dir = str(folder)
    return folder


@pytest.fixture
def adr_key(settings: Settings) -> None:
    """Development, where ADR is called with the API key of the settings (ADR_KEY)."""
    settings.environment = "development"
    settings.adr_api_key = SecretStr(ADR_KEY)


@pytest_asyncio.fixture
async def adr_user(app: FastAPI, adr_key: None) -> AsyncIterator[httpx2.AsyncClient]:
    """USER in development, where ADR is called with the API key of the settings."""
    async with make_client(app, USER) as client:
        yield client
