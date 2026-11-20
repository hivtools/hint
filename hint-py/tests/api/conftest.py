from collections.abc import AsyncIterator, Iterator
from pathlib import Path

import httpx2
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncEngine

from app.config import Settings, get_settings
from app.db.database import create_db_session_factory
from app.main import app
from tests.adr import FakeAdr
from tests.api.helpers import create_project, make_client
from tests.github import ORG, TEAM, FakeGitHub
from tests.hintr import FakeHintr
from tests.support import ADR_KEY, OTHER_USER, USER


@pytest_asyncio.fixture
async def api(engine: AsyncEngine) -> AsyncIterator[httpx2.AsyncClient]:
    """The app (on the test database) as USER."""
    app.state.db_session_factory = create_db_session_factory(engine)
    async with make_client(USER) as client:
        yield client


@pytest_asyncio.fixture
async def version_id(api: httpx2.AsyncClient) -> str:
    """A version of a project of USER."""
    return (await create_project(api))["versions"][0]["id"]


@pytest_asyncio.fixture
async def on_a_version(version_id: str) -> AsyncIterator[httpx2.AsyncClient]:
    """USER, working on `version_id`."""
    async with make_client(USER, version_id) as client:
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


@pytest_asyncio.fixture
async def adr(adr: FakeAdr) -> FakeAdr:
    """The same ADR, now the one that the app calls."""
    app.state.adr_http = adr.http
    return adr


@pytest_asyncio.fixture
async def github(github: FakeGitHub) -> FakeGitHub:
    """The same GitHub, now the one that the app calls."""
    app.state.github_http = github.http
    return github


@pytest.fixture
def github_team(settings_overrides: dict) -> tuple[str, str]:
    """The GitHub team whose members may download a debug zip, as in a real deployment."""
    settings_overrides["github_auth_org"] = ORG
    settings_overrides["github_auth_team_slug"] = TEAM
    return ORG, TEAM


@pytest.fixture
def settings_overrides() -> Iterator[dict]:
    """The settings that the app uses in a test, in addition to the defaults. Fixtures add to this dict. See `results_dir`."""
    overrides: dict = {}
    app.dependency_overrides[get_settings] = lambda: Settings(**overrides)
    yield overrides
    del app.dependency_overrides[get_settings]


@pytest.fixture
def results_dir(tmp_path: Path, settings_overrides: dict) -> Path:
    """An empty folder that the app reads hintr's results from, as it would the share they are written to."""
    folder = tmp_path / "results"
    folder.mkdir()
    settings_overrides["results_dir"] = str(folder)
    return folder


@pytest.fixture
def uploads_dir(tmp_path: Path, settings_overrides: dict) -> Path:
    """An empty folder. The app writes the uploaded files here and tells hintr that the files are here."""
    folder = tmp_path / "uploads"
    folder.mkdir()
    settings_overrides["upload_dir"] = str(folder)
    return folder


@pytest_asyncio.fixture
async def adr_user(adr: FakeAdr, settings_overrides: dict) -> AsyncIterator[httpx2.AsyncClient]:
    """USER in development, where ADR is called with the API key of the settings. Needs no database."""
    settings_overrides["environment"] = "development"
    settings_overrides["adr_api_key"] = ADR_KEY
    async with make_client(USER) as client:
        yield client
