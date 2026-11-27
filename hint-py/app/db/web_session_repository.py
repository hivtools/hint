"""The rows of `web_session` and `web_session_guest_version`. The rules (how long a session lasts, the cookie, the
encryption of the token) are in app/services/web_sessions.py, this only reads and writes."""

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import delete, insert, select, update

from app.clock import as_utc
from app.db.database import DbSession
from app.db.models import WebSession, WebSessionGuestVersion


@dataclass(frozen=True)
class WebSessionRow:
    id_hash: bytes
    user_id: str | None
    encrypted_access_token: str | None
    access_token_expires_at: datetime | None
    created_at: datetime
    expires_at: datetime
    guest_version_ids: frozenset[str]


class WebSessionRepository:
    def __init__(self, db_session: DbSession):
        self.db_session = db_session

    async def create_session(
        self,
        id_hash: bytes,
        *,
        user_id: str | None,
        created_at: datetime,
        expires_at: datetime,
        encrypted_access_token: str | None = None,
        access_token_expires_at: datetime | None = None,
    ) -> None:
        await self.db_session.execute(
            insert(WebSession).values(
                id_hash=id_hash,
                user_id=user_id,
                encrypted_access_token=encrypted_access_token,
                access_token_expires_at=access_token_expires_at,
                created_at=created_at,
                expires_at=expires_at,
            )
        )

    async def get_live_session(self, id_hash: bytes, now: datetime, created_after: datetime) -> WebSessionRow | None:
        """The session, if it has not expired (`expires_at`) and is not too old (`created_after`). Both are checked here,
        so a row that the clean-up has not removed yet lets nobody in."""
        row = (
            await self.db_session.execute(
                select(WebSession).where(
                    WebSession.id_hash == id_hash,
                    WebSession.expires_at > now,
                    WebSession.created_at > created_after,
                )
            )
        ).scalar_one_or_none()
        if row is None:
            return None
        versions = await self.db_session.scalars(
            select(WebSessionGuestVersion.version_id).where(WebSessionGuestVersion.session_id_hash == id_hash)
        )
        return WebSessionRow(
            id_hash=row.id_hash,
            user_id=row.user_id,
            encrypted_access_token=row.encrypted_access_token,
            access_token_expires_at=as_utc(row.access_token_expires_at) if row.access_token_expires_at else None,
            created_at=as_utc(row.created_at),
            expires_at=as_utc(row.expires_at),
            guest_version_ids=frozenset(versions),
        )

    async def extend_session(self, id_hash: bytes, expires_at: datetime) -> None:
        await self.db_session.execute(
            update(WebSession).where(WebSession.id_hash == id_hash).values(expires_at=expires_at)
        )

    async def add_guest_version(self, id_hash: bytes, version_id: str) -> None:
        # One row for each version: two requests at the same time cannot lose one, as a read and a write back could
        await self.db_session.execute(
            insert(WebSessionGuestVersion).values(session_id_hash=id_hash, version_id=version_id)
        )

    async def delete_session(self, id_hash: bytes) -> None:
        await self.db_session.execute(
            delete(WebSessionGuestVersion).where(WebSessionGuestVersion.session_id_hash == id_hash)
        )
        await self.db_session.execute(delete(WebSession).where(WebSession.id_hash == id_hash))


def get_web_session_repository(db_session: DbSession) -> WebSessionRepository:
    return WebSessionRepository(db_session)
