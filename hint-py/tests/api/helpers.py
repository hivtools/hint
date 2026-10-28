"""What the API tests share: clients, and helpers that set things up through the API or the database."""

import json
from datetime import datetime

import httpx
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncEngine

from app import schemas
from app.db.database import create_db_session_factory
from app.db.models import File, ProjectVersion
from app.db.version_repository import VersionRepository
from app.main import app

STATE = json.dumps({"datasets": {}, "model_fit": {"id": "abc"}, "step": 3})


def make_client(user: str, version_id: str | None = None) -> httpx.AsyncClient:
    """A client of the app, who the proxy has identified as `user` (and working on `version_id`, if given).

    Unhandled errors in the app are answered with a 500, as a real client would see, rather than raised in the test.
    """
    headers = {"X-Hint-User": user}
    if version_id:
        headers["X-Version-Id"] = version_id
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    return httpx.AsyncClient(transport=transport, base_url="http://test", headers=headers)


async def create_project(client: httpx.AsyncClient, name: str = "p", note: str | None = None) -> dict:
    r = await client.post("/project", json={"name": name, "note": note})
    assert r.status_code == 200
    return r.json()["data"]


async def save_state(client: httpx.AsyncClient, project: dict, version_id: str | None = None, state: str = STATE):
    version_id = version_id or project["versions"][0]["id"]
    r = await client.post(
        f"/project/{project['id']}/version/{version_id}/state",
        content=state.encode(),
        headers={"Content-Type": "application/json"},
    )
    assert r.status_code == 200


async def add_file(engine: AsyncEngine, version_id: str, file_type: str = "pjnz"):
    async with create_db_session_factory(engine)() as db_session, db_session.begin():
        if await db_session.get(File, "abc123") is None:
            db_session.add(File(hash="abc123"))
            await db_session.flush()
        await VersionRepository(db_session).set_files_for_version(
            version_id,
            {
                file_type: schemas.VersionFile(
                    hash="abc123", filename="spectrum.pjnz", from_adr=False, resource_url=None
                )
            },
        )


async def set_updated(engine: AsyncEngine, version_id: str, updated: datetime):
    """SQLite's CURRENT_TIMESTAMP only has a resolution of a second, so tests that depend on order set the time."""
    async with engine.begin() as conn:
        await conn.execute(update(ProjectVersion).where(ProjectVersion.id == version_id).values(updated=updated))


def assert_failure(r: httpx.Response, status: int, detail: str):
    assert r.status_code == status
    assert r.json() == {"data": {}, "errors": [{"error": "OTHER_ERROR", "detail": detail}], "status": "failure"}
