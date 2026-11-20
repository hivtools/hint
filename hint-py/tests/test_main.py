import logging

import httpx2
import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.byte_limit import MB
from app.config import get_settings
from app.logging_setup import LogHandler
from app.main import UPLOAD_LIMITS, app, lifespan
from app.services.input_file_service import INPUT_FILE_TYPES
from app.services.rehydrate_service import MAX_OUTPUT_ZIP_BYTES, UPLOAD_PATH


async def test_lifespan_sets_up_the_session_factory():
    # The engine connects on first use, so this does not need a database
    async with lifespan(app):
        assert isinstance(app.state.db_session_factory, async_sessionmaker)


@pytest.mark.parametrize("client", ["hintr_http", "adr_http", "github_http"])
async def test_lifespan_sets_up_and_closes_the_http_clients(client):
    async with lifespan(app):
        http = getattr(app.state, client)
        assert isinstance(http, httpx2.AsyncClient)
        assert not http.is_closed
    assert http.is_closed


async def test_lifespan_sets_up_the_logging(monkeypatch):
    monkeypatch.setenv("HINT_LOG_LEVEL", "warning")
    get_settings.cache_clear()
    try:
        async with lifespan(app):
            root = logging.getLogger()
            assert any(isinstance(handler, LogHandler) for handler in root.handlers)
            assert root.level == logging.WARNING
    finally:
        get_settings.cache_clear()


def test_the_upload_limits_have_a_row_for_each_input_file_type_and_one_for_an_output_zip():
    assert UPLOAD_LIMITS == {
        "/baseline/pjnz": 400 * MB,
        "/baseline/shape": 100 * MB,
        "/baseline/population": 150 * MB,
        "/disease/survey": 50 * MB,
        "/disease/programme": 20 * MB,
        "/disease/anc": 10 * MB,
        "/rehydrate/zip": 500 * MB,
    }
    assert {spec.url: spec.max_upload_bytes for spec in INPUT_FILE_TYPES.values()} | {
        UPLOAD_PATH: MAX_OUTPUT_ZIP_BYTES
    } == UPLOAD_LIMITS
