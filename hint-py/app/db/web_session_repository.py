"""The rows of `web_session` and `web_session_guest_version`. The rules (how long a session lasts, the cookie) are in
app/services/web_sessions.py, this only reads and writes."""

from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import delete, insert, select, update

from app.db.database import DbSession
from app.db.models import WebSession, WebSessionGuestVersion


@dataclass(frozen=True)
class WebSessionRow:
    id_hash: bytes
    user_id: str | None
    access_token: str | None
    oauth_state: str | None
    redirect_to: str | None
    created_at: datetime
    expires_at: datetime
    guest_version_ids: frozenset[str]


class WebSessionRepository:
    def __init__(self, db_session: DbSession):
        self.db_session = db_session

    async def create(
        self,
        id_hash: bytes,
        *,
        user_id: str | None,
        created_at: datetime,
        expires_at: datetime,
        access_token: str | None = None,
        oauth_state: str | None = None,
        redirect_to: str | None = None,
    ) -> None:
        await self.db_session.execute(
            insert(WebSession).values(
                id_hash=id_hash,
                user_id=user_id,
                access_token=access_token,
                oauth_state=oauth_state,
                redirect_to=redirect_to,
                created_at=created_at,
                expires_at=expires_at,
            )
        )

    async def get_live(self, id_hash: bytes, now: datetime, created_after: datetime) -> WebSessionRow | None:
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
            access_token=row.access_token,
            oauth_state=row.oauth_state,
            redirect_to=row.redirect_to,
            created_at=_utc(row.created_at),
            expires_at=_utc(row.expires_at),
            guest_version_ids=frozenset(versions),
        )

    async def set_expires_at(self, id_hash: bytes, expires_at: datetime) -> None:
        await self.db_session.execute(
            update(WebSession).where(WebSession.id_hash == id_hash).values(expires_at=expires_at)
        )

    async def set_login_target(self, id_hash: bytes, oauth_state: str, redirect_to: str | None) -> None:
        """What a login with Auth0 that starts from this (guest) session must come back with, and where it goes then."""
        await self.db_session.execute(
            update(WebSession)
            .where(WebSession.id_hash == id_hash)
            .values(oauth_state=oauth_state, redirect_to=redirect_to)
        )

    async def add_guest_version(self, id_hash: bytes, version_id: str) -> None:
        # One row for each version: two requests at the same time cannot lose one, as a read and a write back could
        await self.db_session.execute(
            insert(WebSessionGuestVersion).values(session_id_hash=id_hash, version_id=version_id)
        )

    async def delete(self, id_hash: bytes) -> None:
        await self.db_session.execute(
            delete(WebSessionGuestVersion).where(WebSessionGuestVersion.session_id_hash == id_hash)
        )
        await self.db_session.execute(delete(WebSession).where(WebSession.id_hash == id_hash))


def _utc(value: datetime) -> datetime:
    # Postgres gives a timestamptz back with its time zone. SQLite (the tests) keeps none, and the times are UTC
    return value if value.tzinfo else value.replace(tzinfo=UTC)


def get_web_session_repository(db_session: DbSession) -> WebSessionRepository:
    return WebSessionRepository(db_session)
