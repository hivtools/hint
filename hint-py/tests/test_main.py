from sqlalchemy.ext.asyncio import async_sessionmaker

from app.main import app, lifespan


async def test_lifespan_sets_up_the_session_factory():
    # The engine connects on first use, so this does not need a database
    async with lifespan(app):
        assert isinstance(app.state.db_session_factory, async_sessionmaker)
