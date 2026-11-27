"""The tables this API reads and writes.

The schema is owned by the Kotlin app's migrations (see src/databaseInterface), so these only describe it, they must
never be used to create or change it outside of tests. Foreign keys to `users`, which is not modelled in full, are left
out, the database still enforces them.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, LargeBinary, false
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import expression


class sql_utc_now(expression.FunctionElement):
    """The column default `now() at time zone 'utc'`, which SQLite (used by the tests) cannot run."""

    type = DateTime()
    inherit_cache = True


@compiles(sql_utc_now, "postgresql")
def _utc_now_postgresql(element, compiler, **kw) -> str:
    return "(now() at time zone 'utc')"


@compiles(sql_utc_now, "sqlite")
def _utc_now_sqlite(element, compiler, **kw) -> str:
    return "CURRENT_TIMESTAMP"


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(primary_key=True)
    username: Mapped[str | None]


class File(Base):
    """A file that has been uploaded, by the hash of its content."""

    __tablename__ = "file"

    hash: Mapped[str] = mapped_column(primary_key=True)


class Project(Base):
    __tablename__ = "project"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str | None]
    name: Mapped[str]
    note: Mapped[str | None]
    shared_by: Mapped[str | None]
    is_uploaded: Mapped[bool | None] = mapped_column(server_default=false())


class ProjectVersion(Base):
    __tablename__ = "project_version"

    id: Mapped[str] = mapped_column(primary_key=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("project.id"))
    state: Mapped[str | None]
    note: Mapped[str | None]
    # These are nullable in the schema, but always set (by column defaults and the project_version_updated trigger)
    created: Mapped[datetime] = mapped_column(server_default=sql_utc_now())
    updated: Mapped[datetime] = mapped_column(server_default=sql_utc_now())
    deleted: Mapped[bool | None] = mapped_column(server_default=false())
    version_number: Mapped[int]


class VersionFile(Base):
    __tablename__ = "version_file"

    version: Mapped[str] = mapped_column(ForeignKey("project_version.id"), primary_key=True)
    hash: Mapped[str] = mapped_column(ForeignKey("file.hash"), primary_key=True)
    type: Mapped[str] = mapped_column(primary_key=True)
    filename: Mapped[str]
    from_adr: Mapped[bool] = mapped_column(server_default=false())
    resource_url: Mapped[str | None]


class WebSession(Base):
    """A login, or a guest's visit. The cookie holds a random id, and this table only the SHA-256 of it. See
    app/services/web_sessions.py."""

    __tablename__ = "web_session"

    id_hash: Mapped[bytes] = mapped_column(LargeBinary, primary_key=True)
    # None for someone who has not logged in (a guest)
    user_id: Mapped[str | None]
    # Encrypted (app/services/token_encryption.py)
    encrypted_access_token: Mapped[str | None]
    access_token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class WebSessionGuestVersion(Base):
    """A version that the server gave to a guest (POST /guest/version): the only record of which versions are theirs."""

    __tablename__ = "web_session_guest_version"

    session_id_hash: Mapped[bytes] = mapped_column(
        LargeBinary, ForeignKey("web_session.id_hash", ondelete="CASCADE"), primary_key=True
    )
    version_id: Mapped[str] = mapped_column(ForeignKey("project_version.id", ondelete="CASCADE"), primary_key=True)
