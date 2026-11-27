"""The time, always in UTC.

Code that needs the time calls `clock.utc_now()` (import the module, not the function), so that a test can move the clock
with `monkeypatch.setattr(clock, "utc_now", ...)`.
"""

from datetime import UTC, datetime


def utc_now() -> datetime:
    return datetime.now(UTC)


def as_utc(value: datetime) -> datetime:
    """`value` with its time zone. Postgres gives a `timestamptz` back with its zone; SQLite (the tests) keeps none, and
    every time this API writes is UTC."""
    return value if value.tzinfo else value.replace(tzinfo=UTC)
