"""Where the logs go and what they look like (app/logging_setup.py). `isolated_logging` in conftest.py puts the loggers
back after each test."""

import json
import logging
import logging.config
import sys
from collections.abc import Iterator

import pytest
import structlog
import uvicorn.config
from pydantic import ValidationError

from app.config import LogFormat, LogLevel, Settings
from app.logging_setup import RESERVED_FIELDS, UVICORN_LOGGERS, LogHandler, configure_logging

log = structlog.get_logger()


class Recorder(logging.Handler):
    """What OpenTelemetry's handler is to the root logger: something else that gets what reaches it."""

    def __init__(self):
        super().__init__()
        self.records: list[logging.LogRecord] = []

    def emit(self, record):
        self.records.append(record)


@pytest.fixture
def otel() -> Iterator[Recorder]:
    recorder = Recorder()
    logging.getLogger().addHandler(recorder)
    yield recorder
    logging.getLogger().removeHandler(recorder)


def fail() -> None:
    raise ValueError("boom")


def configure(level: LogLevel = "INFO", log_format: LogFormat = "console") -> None:
    configure_logging(Settings(log_level=level, log_format=log_format))


def lines(capsys) -> list[str]:
    return [line for line in capsys.readouterr().err.splitlines() if line.strip()]


def fields(record: logging.LogRecord) -> dict:
    """What a call of structlog put on a record: the attributes that a plain `logging` record does not have."""
    return {name: value for name, value in record.__dict__.items() if name not in RESERVED_FIELDS}


# ---- What the libraries log (the standard library's logging)


def test_what_a_library_logs_is_written_once(capsys):
    configure()

    logging.getLogger("some.library").warning("hello %s", "world")

    [line] = lines(capsys)
    assert "warning" in line
    assert "hello world" in line
    assert "some.library" in line


def test_the_traceback_of_what_a_library_logs_is_kept(capsys):
    configure()

    try:
        fail()
    except ValueError:
        logging.getLogger("some.library").exception("it failed")

    err = capsys.readouterr().err
    assert "it failed" in err
    assert "ValueError: boom" in err


def test_braces_in_what_a_library_logs_are_not_a_format(capsys):
    configure()
    logging.getLogger("some.library").error("price {x} is %s", "10")
    [line] = lines(capsys)
    assert "price {x} is 10" in line


@pytest.mark.parametrize("name", UVICORN_LOGGERS)
def test_uvicorns_loggers_pass_on_to_the_root_logger_and_have_no_handlers_of_their_own(name):
    logging.config.dictConfig(uvicorn.config.LOGGING_CONFIG)

    configure()

    assert logging.getLogger(name).handlers == []
    assert logging.getLogger(name).propagate


def test_what_uvicorn_logs_is_written_once_and_not_in_its_own_format(capsys):
    logging.config.dictConfig(uvicorn.config.LOGGING_CONFIG)
    configure()

    logging.getLogger("uvicorn.access").info("127.0.0.1 - GET /version 200")

    [line] = lines(capsys)
    assert "GET /version 200" in line
    assert "info" in line
    assert not line.startswith("INFO:")  # uvicorn's own format


@pytest.mark.parametrize("name", UVICORN_LOGGERS)
def test_the_colour_text_that_uvicorn_adds_to_a_record_is_not_a_field(capsys, otel, name):
    configure()

    logging.getLogger(name).info(
        "Finished server process [%d]", 1, extra={"color_message": "Finished server process [\x1b[36m%d\x1b[0m]"}
    )

    [line] = lines(capsys)
    assert "Finished server process [1]" in line
    assert "color_message" not in line
    assert "\x1b" not in line
    assert not hasattr(otel.records[0], "color_message")


# ---- What this API logs (structlog)


def test_what_the_api_logs_is_a_message_with_fields(capsys):
    configure()

    log.info("Cloning project", project=3, users=["a@example.com"])

    [line] = lines(capsys)
    assert "Cloning project" in line
    assert "project=3" in line
    assert "users=['a@example.com']" in line
    assert "info" in line


def test_the_traceback_of_what_the_api_logs_is_kept(capsys):
    configure()

    try:
        fail()
    except ValueError:
        log.exception("it failed", task="t1")

    err = capsys.readouterr().err
    assert "it failed" in err
    assert "task=t1" in err
    assert "ValueError: boom" in err


def test_an_exception_can_be_given_to_the_call_and_none_is_no_traceback(capsys):
    configure()
    try:
        fail()
    except ValueError as e:
        error = e

    log.error("with", exc_info=error)
    err = capsys.readouterr().err
    assert "ValueError: boom" in err
    assert "exc_info" not in err

    log.error("without", exc_info=None)
    assert "Traceback" not in capsys.readouterr().err


def test_a_message_with_braces_is_not_a_format(capsys):
    configure()
    log.error("hintr said {not a field}")
    [line] = lines(capsys)
    assert "hintr said {not a field}" in line


# ---- The format


def test_json_is_one_object_for_each_message(capsys):
    configure(log_format="json")

    log.info("Cloning project", project=3, users=["a@example.com"])

    [line] = lines(capsys)
    entry = json.loads(line)
    assert entry["message"] == "Cloning project"
    assert entry["level"] == "info"
    assert entry["logger"] == __name__
    assert entry["project"] == 3
    assert entry["users"] == ["a@example.com"]
    assert entry["timestamp"].endswith("Z")
    assert "event" not in entry


def test_json_is_the_same_for_what_a_library_logs(capsys):
    configure(log_format="json")

    logging.getLogger("some.library").warning("hello %s", "world")

    [entry] = [json.loads(line) for line in lines(capsys)]
    assert entry["message"] == "hello world"
    assert entry["level"] == "warning"
    assert entry["logger"] == "some.library"
    assert "timestamp" in entry


def test_json_has_the_traceback_as_text(capsys):
    configure(log_format="json")

    try:
        fail()
    except ValueError:
        log.exception("it failed")

    [line] = lines(capsys)
    assert "ValueError: boom" in json.loads(line)["exception"]


def test_auto_is_json_when_stderr_is_not_a_terminal(capsys):
    configure(log_format="auto")
    log.info("hello")
    [line] = lines(capsys)
    assert json.loads(line)["message"] == "hello"


def test_auto_is_console_in_a_terminal(capsys, monkeypatch):
    monkeypatch.setattr("app.logging_setup._is_terminal", lambda: True)
    configure(log_format="auto")
    log.info("hello")
    [line] = lines(capsys)
    assert "hello" in line
    assert not line.startswith("{")


@pytest.mark.skipif(sys.platform == "win32", reason="colours on Windows need colorama to take over the terminal")
def test_console_has_colours_in_a_terminal_and_not_otherwise(capsys, monkeypatch):
    configure()
    log.info("hello")
    assert "\x1b[" not in capsys.readouterr().err

    monkeypatch.setattr("app.logging_setup._is_terminal", lambda: True)
    configure()
    log.info("hello")
    assert "\x1b[" in capsys.readouterr().err


# ---- The level


@pytest.mark.parametrize("name", UVICORN_LOGGERS)
def test_the_level_applies_to_uvicorns_loggers_whatever_level_uvicorn_gave_them(otel, name):
    logging.config.dictConfig(uvicorn.config.LOGGING_CONFIG)  # INFO
    configure("WARNING")

    logging.getLogger(name).info("too quiet")
    logging.getLogger(name).warning("loud enough")

    # Not for OpenTelemetry's handler either, which the level of the root logger does not stop it getting
    assert [r.getMessage() for r in otel.records] == ["loud enough"]


LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR"]


@pytest.mark.parametrize("level", LEVELS)
def test_only_what_is_at_the_level_or_above_is_logged_by_either(capsys, level):
    configure(level)

    for name in LEVELS:
        getattr(log, name.lower())(f"structlog {name}")
        getattr(logging.getLogger("some.library"), name.lower())("logging %s", name)

    shown = " ".join(lines(capsys))
    expected = LEVELS[LEVELS.index(level) :]
    for name in LEVELS:
        assert (f"structlog {name}" in shown) == (name in expected), name
        assert (f"logging {name}" in shown) == (name in expected), name


def test_a_log_level_setting_can_be_in_any_case(monkeypatch):
    assert Settings().log_level == "INFO"
    monkeypatch.setenv("HINT_LOG_LEVEL", "debug")
    assert Settings().log_level == "DEBUG"


@pytest.mark.parametrize("value", ["loud", "TRACE", "SUCCESS"])
def test_a_log_level_that_is_not_one_is_refused(monkeypatch, value):
    monkeypatch.setenv("HINT_LOG_LEVEL", value)
    with pytest.raises(ValidationError):
        Settings()


def test_a_log_format_that_is_not_one_is_refused(monkeypatch):
    monkeypatch.setenv("HINT_LOG_FORMAT", "xml")
    with pytest.raises(ValidationError):
        Settings()


def test_the_log_format_is_auto_by_default(monkeypatch):
    monkeypatch.delenv("HINT_LOG_FORMAT", raising=False)
    assert Settings().log_format == "auto"


# ---- OpenTelemetry: its handler is on the root logger, and gets every message there


def test_what_the_api_logs_reaches_the_handlers_of_the_root_logger_once_as_a_record_with_attributes(capsys, otel):
    configure()

    log.warning("Cloning project", project=3, users=["a@example.com"])

    [record] = otel.records
    assert (record.levelno, record.levelname) == (logging.WARNING, "WARNING")
    # The message is the text, not the dict that structlog works with
    assert record.getMessage() == "Cloning project"
    assert fields(record) == {"project": 3, "users": ["a@example.com"]}
    assert record.name == __name__
    # The place that logged, not structlog
    assert record.pathname.endswith("test_logging_setup.py")
    # And it was written once
    assert len(lines(capsys)) == 1


def test_what_a_library_logs_reaches_the_handlers_of_the_root_logger_once(capsys, otel):
    configure()

    logging.getLogger("some.library").error("from a library")

    [record] = otel.records
    assert record.name == "some.library"
    assert len(lines(capsys)) == 1


def test_the_exception_of_what_the_api_logs_is_on_the_record(otel):
    configure()

    try:
        fail()
    except ValueError:
        log.exception("it failed")

    [record] = otel.records
    assert record.levelno == logging.ERROR
    assert record.exc_info is not None
    assert record.exc_info[0] is ValueError
    assert str(record.exc_info[1]) == "boom"


def test_a_field_with_a_name_that_logging_keeps_is_renamed_and_does_not_fail(otel):
    configure()

    log.info("fine", name="mine", message="mine", lineno=0, args=[1])

    [record] = otel.records
    assert record.name == __name__
    assert record.getMessage() == "fine"
    assert fields(record) == {"name_": "mine", "message_": "mine", "lineno_": 0, "args_": [1]}


def test_what_is_bound_for_the_request_is_on_every_record_of_it(otel):
    configure()
    structlog.contextvars.bind_contextvars(request="r1")
    try:
        log.info("one")
    finally:
        structlog.contextvars.clear_contextvars()
    log.info("two")

    assert [fields(r) for r in otel.records] == [{"request": "r1"}, {}]


# ---- Setting it up again, and what else is on the root logger


def test_setting_it_up_again_does_not_log_twice_or_remove_the_handlers_that_are_not_ours(capsys, otel):
    configure()
    configure()

    log.error("once")
    logging.getLogger("some.library").error("also once")

    root = logging.getLogger()
    assert len([h for h in root.handlers if isinstance(h, LogHandler)]) == 1
    assert otel in root.handlers
    assert len(lines(capsys)) == 2
    assert [r.getMessage() for r in otel.records] == ["once", "also once"]


def test_the_handlers_that_pytest_puts_on_the_root_logger_stay(caplog):
    handlers = [h for h in logging.getLogger().handlers if not isinstance(h, LogHandler)]
    configure()
    assert all(h in logging.getLogger().handlers for h in handlers)


def test_caplog_sees_what_the_api_logs(caplog):
    log.warning("seen", task="t1")
    [record] = caplog.records
    assert (record.getMessage(), record.task) == ("seen", "t1")


def test_what_another_handler_adds_to_a_record_is_not_a_field(caplog, capsys):
    # caplog's handler formats the record first, which adds `message` and `asctime` to it
    configure()
    log.info("hello", task="t1")
    [line] = lines(capsys)
    assert "task=t1" in line
    assert "message=" not in line
    assert "asctime" not in line


def test_the_root_logger_is_given_the_level_so_that_what_is_below_it_never_gets_to_a_handler():
    configure("WARNING")
    assert logging.getLogger().level == logging.WARNING
    configure("DEBUG")
    assert logging.getLogger().level == logging.DEBUG
