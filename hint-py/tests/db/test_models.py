from sqlalchemy.dialects import postgresql, sqlite
from sqlalchemy.schema import CreateTable

from app.db.models import Base

PROJECT = Base.metadata.tables["project"]
PROJECT_VERSION = Base.metadata.tables["project_version"]


def test_version_dates_default_to_now_in_utc_as_in_the_real_schema():
    ddl = str(CreateTable(PROJECT_VERSION).compile(dialect=postgresql.dialect()))

    assert ddl.count("DEFAULT (now() at time zone 'utc')") == 2


def test_the_test_database_gets_a_default_it_can_run():
    ddl = str(CreateTable(PROJECT_VERSION).compile(dialect=sqlite.dialect()))

    assert ddl.count("DEFAULT CURRENT_TIMESTAMP") == 2


def test_flags_default_to_false():
    assert "is_uploaded BOOLEAN DEFAULT false" in str(CreateTable(PROJECT).compile(dialect=postgresql.dialect()))
