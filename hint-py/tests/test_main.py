import httpx2
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.main import app, lifespan


async def test_lifespan_sets_up_the_session_factory():
    # The engine connects on first use, so this does not need a database
    async with lifespan(app):
        assert isinstance(app.state.db_session_factory, async_sessionmaker)


async def test_lifespan_sets_up_and_closes_the_hintr_client():
    async with lifespan(app):
        hintr_http = app.state.hintr_http
        assert isinstance(hintr_http, httpx2.AsyncClient)
        assert not hintr_http.is_closed
    assert hintr_http.is_closed
