"""Logging: where each log message goes, and what it looks like.

The API logs with structlog (`log = structlog.get_logger()`). structlog gives each message to the standard `logging`
module. The libraries that the API uses (uvicorn, httpx, SQLAlchemy) also use `logging`. So all messages follow one path:

    structlog --+
                +--> root logger --+--> our handler --> stderr (console or JSON)
    library ----+                  \\--> OpenTelemetry handler (if it is on)

Format
------
`HINT_LOG_FORMAT` selects what our handler writes to stderr:

- `console`: one line for each message, with colours if stderr is a terminal. For people.
- `json`: one JSON object for each message. For machines (log collectors, `jq`).
- `auto` (the default): `console` if stderr is a terminal, if not `json`.

A call such as `log.info("Cloning project", project=3, users=["a@b.c"])` has the message "Cloning project". The keyword
arguments (`project`, `users`) are the fields of the message. In JSON they are fields of the object. In OpenTelemetry
they are attributes of the log record.

Level
-----
`HINT_LOG_LEVEL` is the lowest level that is written. It applies to the API and to the libraries.
"""

import logging
import sys

import structlog
from structlog.stdlib import LOG_KWARG_NAMES
from structlog.typing import EventDict, Processor

from app.config import Settings

# The loggers that uvicorn gives handlers of its own (and that do not pass on to the root logger) when it starts
UVICORN_LOGGERS = ("uvicorn", "uvicorn.error", "uvicorn.access")

# The names that every `logging` record has. `logging` raises an error if a field has one of these names.
RESERVED_FIELDS = frozenset(logging.LogRecord("", 0, "", 0, "", (), None).__dict__) | {"message", "asctime"}


class LogHandler(logging.StreamHandler):
    """The handler that writes to stderr. It has its own class, to find it and replace it when the logging is set up
    again."""


def _is_terminal() -> bool:
    return sys.stderr.isatty()


def _rename_reserved_fields(_logger: object, _method: str, event_dict: EventDict) -> EventDict:
    """A field with a name that `logging` keeps for itself (`name`, `message`, `args`...) gets an underscore at the end.

    If it did not, `logging` would raise an error and the call that logs would fail.
    """
    # Not the arguments of `logging` itself (`exc_info`...), which structlog passes on as they are
    for name in RESERVED_FIELDS.intersection(event_dict) - set(LOG_KWARG_NAMES):
        event_dict[f"{name}_"] = event_dict.pop(name)
    return event_dict


def _drop_what_logging_adds(_logger: object, _method: str, event_dict: EventDict) -> EventDict:
    """Remove `message` and `asctime` from the fields.

    A handler that formats a record adds these two attributes to it, and all handlers share the same record. If another
    handler (for example pytest's `caplog`) formats the record first, `ExtraAdder` finds the two attributes and shows
    them as fields. They are not fields of the message. They are a copy of the text and of the time.
    """
    event_dict.pop("message", None)
    event_dict.pop("asctime", None)
    return event_dict


def _drop_color_message(record: logging.LogRecord) -> bool:
    """Remove `color_message` from the records of uvicorn.

    uvicorn adds this to some records (for example "Started server process"): the text again, with the codes for
    terminal colours in it. No handler needs it. It would be a field in our output (with the codes as raw text) and an
    attribute in OpenTelemetry. This is a filter on the uvicorn loggers, so it runs before any handler sees the record.
    """
    record.__dict__.pop("color_message", None)
    return True


def _renderers(log_format: str) -> list[Processor]:
    """The last steps for each message: from the fields to the text for stderr."""
    terminal = _is_terminal()
    if log_format == "auto":
        log_format = "console" if terminal else "json"
    if log_format == "json":
        return [
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            # Text, not a list of stack frames: it has no values of variables, and every log collector shows it
            structlog.processors.format_exc_info,
            structlog.processors.EventRenamer("message"),
            structlog.processors.JSONRenderer(),
        ]
    return [
        structlog.stdlib.ProcessorFormatter.remove_processors_meta,
        # plain_traceback: the other formatters (rich) show the values of variables, which can be what users sent
        structlog.dev.ConsoleRenderer(colors=terminal, exception_formatter=structlog.dev.plain_traceback),
    ]


def configure_logging(settings: Settings) -> None:
    """Set up the logging described above.

    The app calls this one time, when it starts. The tests call it many times. A second call starts again from nothing:
    it replaces our handler and does not add a second one. (A second handler would write each message two times.)
    Handlers that other code added, for example the one from OpenTelemetry, stay.
    """
    level = logging.getLevelNamesMapping()[settings.log_level]

    # What happens to a structlog call, for example `log.info("text", field=1)`:
    # 1. structlog drops the call if its level is lower than the level that is set.
    # 2. `render_to_log_kwargs` gives the call to Python's `logging`. The text is the message. The fields are
    #    attributes of the log record.
    # Then `logging` gives the record to our handler (below), which writes it. The handler does the same for the
    # records of libraries. For this reason all messages look the same.
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.contextvars.merge_contextvars,
            _rename_reserved_fields,
            structlog.stdlib.render_to_log_kwargs,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
    )

    handler = LogHandler(sys.stderr)
    handler.setFormatter(
        structlog.stdlib.ProcessorFormatter(
            # Every record goes through these, whether it came from structlog or from a library
            foreign_pre_chain=[
                structlog.stdlib.add_log_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.ExtraAdder(),
                _drop_what_logging_adds,
                structlog.processors.TimeStamper(fmt="iso", utc=True),
            ],
            processors=_renderers(settings.log_format),
        )
    )

    root = logging.getLogger()
    # Remove our handler from an earlier call, if there is one. Do not remove other handlers: OpenTelemetry adds its
    # handler before the app starts, and it must stay.
    for old in [h for h in root.handlers if isinstance(h, LogHandler)]:
        root.removeHandler(old)
    root.addHandler(handler)
    # A logger drops each record that is below its level. The records of libraries pass through the root logger, so
    # this level applies to them too.
    root.setLevel(level)
    # When uvicorn starts, it sets up its loggers so that their records do not reach the root logger: `uvicorn` and
    # `uvicorn.access` have handlers of their own (with uvicorn's format) and `propagate` is off. (`uvicorn.error` gives
    # its records to `uvicorn`.) Each also has its own level (INFO). A logger checks its own level before it passes a
    # record on, so the level of the root logger does not stop them.
    # We change all of this: we remove their handlers, turn `propagate` ON, and give them our level.
    for name in UVICORN_LOGGERS:
        uvicorn_logger = logging.getLogger(name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.propagate = True
        uvicorn_logger.setLevel(level)
        uvicorn_logger.addFilter(_drop_color_message)  # (adding the same filter again does nothing)
