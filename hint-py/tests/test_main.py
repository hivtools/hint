import logging

import httpx2
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.config import Settings
from app.logging_setup import LogHandler
from app.main import create_app


def started(app):
    """What uvicorn does when the app starts and stops. The test clients do not do it."""
    return app.router.lifespan_context(app)


async def test_starting_sets_up_the_session_factory():
    app = create_app(Settings())
    # The engine connects on first use, so this does not need a database
    async with started(app):
        assert isinstance(app.state.db_session_factory, async_sessionmaker)


async def test_starting_sets_up_the_clients_and_stopping_closes_them():
    app = create_app(Settings())
    async with started(app):
        hintr_http = app.state.hintr_http
        adr_http = app.state.adr_http
        assert isinstance(hintr_http, httpx2.AsyncClient)
        assert not hintr_http.is_closed
        assert not adr_http.is_closed
    assert hintr_http.is_closed
    assert adr_http.is_closed


async def test_starting_sets_up_the_logging_of_the_settings():
    async with started(create_app(Settings(log_level="WARNING"))):
        root = logging.getLogger()
        assert any(isinstance(handler, LogHandler) for handler in root.handlers)
        assert root.level == logging.WARNING


async def test_what_a_test_gives_is_ready_without_starting_and_is_not_closed():
    db_session_factory = async_sessionmaker()
    hintr_http = httpx2.AsyncClient()
    adr_http = httpx2.AsyncClient()
    app = create_app(Settings(), db_session_factory=db_session_factory, hintr_http=hintr_http, adr_http=adr_http)

    assert app.state.db_session_factory is db_session_factory
    async with started(app):
        assert app.state.hintr_http is hintr_http
        assert app.state.adr_http is adr_http
    assert not hintr_http.is_closed
    assert not adr_http.is_closed
    await hintr_http.aclose()
    await adr_http.aclose()


async def test_each_app_answers_with_its_own_settings():
    apps = {url: create_app(Settings(adr_url=url)) for url in ("https://one.example/", "https://two.example/")}
    for url, app in apps.items():
        transport = httpx2.ASGITransport(app=app)
        async with httpx2.AsyncClient(transport=transport, base_url="http://test") as client:
            assert (await client.get("/adr/schemas")).json()["data"]["baseUrl"] == url
