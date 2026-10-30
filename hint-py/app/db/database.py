from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.config import Settings


def create_engine(settings: Settings) -> AsyncEngine:
    # Does not connect yet, the first query does
    return create_async_engine(settings.database_url)


def create_db_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)


async def get_db_session(request: Request) -> AsyncIterator[AsyncSession]:
    """One db session, and one transaction, per request: committed when the endpoint returns, rolled back if it raises."""
    async with request.app.state.db_session_factory() as db_session, db_session.begin():
        yield db_session


# scope="function" makes the commit happen as soon as the endpoint returns, before the response is sent. By default
# FastAPI runs the cleanup of a dependency after the response has gone out, so a client could get its 200 and send the
# next request before the commit, or never find out that the commit failed.
DbSession = Annotated[AsyncSession, Depends(get_db_session, scope="function")]
