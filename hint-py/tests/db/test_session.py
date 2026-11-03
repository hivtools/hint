from typing import Annotated

import httpx2
import pytest
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.database import create_db_session_factory, get_db_session
from app.db.models import Base
from app.db.project_repository import ProjectRepository, get_project_repository


@pytest.fixture
async def app_and_events():
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    events: list[str] = []
    event.listen(engine.sync_engine, "commit", lambda _conn: events.append("commit"))
    event.listen(engine.sync_engine, "rollback", lambda _conn: events.append("rollback"))

    app = FastAPI()
    app.state.db_session_factory = create_db_session_factory(engine)

    @app.middleware("http")
    async def record_response(request, call_next):
        response = await call_next(request)
        events.append("response")
        return response

    @app.post("/projects")
    async def create(repo: Annotated[ProjectRepository, Depends(get_project_repository)]):
        return {"id": await repo.save_new_project("u", "p")}

    @app.post("/fails")
    async def fails(repo: Annotated[ProjectRepository, Depends(get_project_repository)]):
        await repo.save_new_project("u", "p")
        raise HTTPException(status_code=409)

    yield app, engine, events
    await engine.dispose()


async def count_projects(engine) -> int:
    async with engine.connect() as conn:
        return (await conn.execute(text("select count(*) from project"))).scalar_one()


async def test_changes_are_committed_before_the_response_is_sent(app_and_events):
    app, engine, events = app_and_events
    async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/projects")

    assert r.status_code == 200
    assert events == ["commit", "response"]
    assert await count_projects(engine) == 1


async def test_changes_are_rolled_back_if_the_endpoint_fails(app_and_events):
    app, engine, events = app_and_events
    async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/fails")

    assert r.status_code == 409
    assert "commit" not in events
    assert await count_projects(engine) == 0


def test_db_session_uses_get_db_session():
    # Guards against the dependency being replaced without the commit timing above being thought about
    from app.db.database import DbSession

    assert DbSession.__metadata__[0].dependency is get_db_session
