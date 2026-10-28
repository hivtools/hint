"""The tables this API reads and writes.

The schema is owned by the Kotlin app's migrations (see src/databaseInterface), so these only describe it, they must
never be used to create or change it outside of tests. Foreign keys to tables that are not modelled here (`users`,
`file`) are left out, the database still enforces them.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, false
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import expression


class utc_now(expression.FunctionElement):
    """The column default `now() at time zone 'utc'`, which SQLite (used by the tests) cannot run."""

    type = DateTime()
    inherit_cache = True


@compiles(utc_now, "postgresql")
def _utc_now_postgresql(element, compiler, **kw) -> str:
    return "(now() at time zone 'utc')"


@compiles(utc_now, "sqlite")
def _utc_now_sqlite(element, compiler, **kw) -> str:
    return "CURRENT_TIMESTAMP"


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(primary_key=True)
    username: Mapped[str | None]


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
    created: Mapped[datetime] = mapped_column(server_default=utc_now())
    updated: Mapped[datetime] = mapped_column(server_default=utc_now())
    deleted: Mapped[bool | None] = mapped_column(server_default=false())
    version_number: Mapped[int]


class VersionFile(Base):
    __tablename__ = "version_file"

    version: Mapped[str] = mapped_column(ForeignKey("project_version.id"), primary_key=True)
    hash: Mapped[str] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(primary_key=True)
    filename: Mapped[str]
    from_adr: Mapped[bool] = mapped_column(server_default=false())
    resource_url: Mapped[str | None]
