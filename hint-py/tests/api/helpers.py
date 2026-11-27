"""What the API tests share: clients, and helpers that set things up through the API or the database."""

import hashlib
import json
import secrets
from collections.abc import AsyncGenerator, Collection
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta

import httpx2
from fastapi import FastAPI
from pydantic import SecretStr
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app import schemas
from app.db.database import create_db_session_factory
from app.db.models import File, ProjectVersion
from app.db.version_repository import VersionRepository
from app.db.web_session_repository import WebSessionRepository
from app.dependencies import GUEST_USER
from app.main import app
from app.schemas import FileType
from app.services.token_encryption import TokenEncryption
from app.services.web_sessions import COOKIE_NAME
from tests.support import SESSION_ENCRYPTION_KEY

STATE = json.dumps({"datasets": {}, "model_fit": {"id": "abc"}, "step": 3})


async def create_web_session(
    db_session_factory: async_sessionmaker[AsyncSession],
    user: str,
    guest_versions: Collection[str] = (),
    access_token: str | None = None,
    access_token_expires_at: datetime | None = None,
) -> str:
    """A live session in the database for `user` (or a guest who was given `guest_versions`), as a login or
    POST /guest/version makes. It gives the id for the cookie."""
    session_id = secrets.token_urlsafe(32)
    id_hash = hashlib.sha256(session_id.encode()).digest()
    now = datetime.now(UTC)
    async with db_session_factory() as db_session, db_session.begin():
        repository = WebSessionRepository(db_session)
        await repository.create_session(
            id_hash,
            user_id=None if user == GUEST_USER else user,
            encrypted_access_token=TokenEncryption([SecretStr(SESSION_ENCRYPTION_KEY)]).encrypt(access_token)
            if access_token
            else None,
            access_token_expires_at=access_token_expires_at,
            created_at=now,
            expires_at=now + timedelta(days=1),
        )
        for version_id in guest_versions:
            await repository.add_guest_version(id_hash, version_id)
    return session_id


@asynccontextmanager
async def make_client(
    user: str,
    version_id: str | None = None,
    *,
    guest_versions: Collection[str] = (),
    access_token: str | None = None,
    access_token_expires_at: datetime | None = None,
    to: FastAPI = app,
) -> AsyncGenerator[httpx2.AsyncClient]:
    """A client of the app (or of the app `to`), logged in as `user` with a session cookie (and working on `version_id`,
    if given). A guest with no `guest_versions` has no session, as a new visitor.

    Unhandled errors in the app are answered with a 500, as a real client would see, rather than raised in the test.
    """
    headers = {"X-Version-Id": version_id} if version_id else {}
    cookies = {}
    if user != GUEST_USER or guest_versions or access_token:
        cookies[COOKIE_NAME] = await create_web_session(
            to.state.db_session_factory, user, guest_versions, access_token, access_token_expires_at
        )
    transport = httpx2.ASGITransport(app=to, raise_app_exceptions=False)
    async with httpx2.AsyncClient(transport=transport, base_url="http://test", headers=headers, cookies=cookies) as c:
        yield c


async def create_project(client: httpx2.AsyncClient, name: str = "p", note: str | None = None) -> dict:
    r = await client.post("/project", json={"name": name, "note": note})
    assert r.status_code == 200
    return r.json()["data"]


async def save_state(client: httpx2.AsyncClient, project: dict, version_id: str | None = None, state: str = STATE):
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
                FileType(file_type): schemas.VersionFile(
                    hash="abc123", filename="spectrum.pjnz", from_adr=False, resource_url=None
                )
            },
        )


async def add_files(engine: AsyncEngine, version_id: str, *file_types: str):
    """Gives the version a file of each type, named after it (a `pjnz` file is `pjnz.pjnz` with the hash `pjnz123`)."""
    async with create_db_session_factory(engine)() as db_session, db_session.begin():
        files = {}
        for file_type in file_types:
            db_session.add(File(hash=f"{file_type}123"))
            files[FileType(file_type)] = schemas.VersionFile(
                hash=f"{file_type}123", filename=f"{file_type}.{file_type}", from_adr=False, resource_url=None
            )
        await db_session.flush()
        await VersionRepository(db_session).set_files_for_version(version_id, files)


def hintr_file(file_type: str) -> dict:
    """What hintr is told about a file that `add_files` gave a version."""
    return {
        "path": f"/uploads/{file_type}123",
        "hash": f"{file_type}123",
        "filename": f"{file_type}.{file_type}",
        "fromADR": False,
        "resource_url": None,
    }


async def set_updated(engine: AsyncEngine, version_id: str, updated: datetime):
    """SQLite's CURRENT_TIMESTAMP only has a resolution of a second, so tests that depend on order set the time."""
    async with engine.begin() as conn:
        await conn.execute(update(ProjectVersion).where(ProjectVersion.id == version_id).values(updated=updated))


def assert_failure(r: httpx2.Response, status: int, detail: str):
    assert r.status_code == status
    assert r.json() == {"data": {}, "errors": [{"error": "OTHER_ERROR", "detail": detail}], "status": "failure"}


async def version_files(engine: AsyncEngine, version_id: str) -> dict[str, tuple[str, str, bool, str | None]]:
    """The files of the version in the database, by file type: (hash, filename, from_adr, resource_url)."""
    async with create_db_session_factory(engine)() as db_session:
        files = await VersionRepository(db_session).get_version_files(version_id)
    return {t.value: (f.hash, f.filename, f.from_adr, f.resource_url) for t, f in files.items()}


async def known_hashes(engine: AsyncEngine) -> list[str]:
    """The hashes in the table of uploaded files."""
    async with create_db_session_factory(engine)() as db_session:
        return sorted(await db_session.scalars(select(File.hash)))
