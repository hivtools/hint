"""Errors in the format the Vue app expects: {"status": "failure", "data": {}, "errors": [{"error": ..., "detail": ...}]}.

`detail` is translated using the Accept-Language header. Raise a HintError (or one of its subclasses) for an error the
user should see; anything else that goes wrong is reported as an "unexpected error" with a code to quote to support.
"""

import logging
import secrets

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.messages import negotiate_language, t

DEFAULT_ERROR = "OTHER_ERROR"

logger = logging.getLogger(__name__)


class HintError(Exception):
    def __init__(self, key: str, status_code: int = 500, code: str = DEFAULT_ERROR):
        super().__init__(f"HintError with key {key}")
        self.key = key
        self.status_code = status_code
        self.code = code


class ProjectDoesNotExistError(HintError):
    """The project does not exist, or belongs to someone else."""

    def __init__(self):
        super().__init__("projectDoesNotExist", 400)


class VersionDoesNotExistError(HintError):
    """The version does not exist, or is not in that project, or belongs to someone else."""

    def __init__(self):
        super().__init__("versionDoesNotExist", 400)


class InvalidVersionError(HintError):
    """The user may not use the version in the X-Version-Id header (or sent none). The Vue app starts again on this code."""

    def __init__(self):
        super().__init__("invalidVersion", 403, "INVALID_VERSION")


class UserDoesNotExistError(HintError):
    def __init__(self):
        super().__init__("userDoesNotExist", 400)


class InvalidEmailError(HintError):
    def __init__(self):
        super().__init__("invalidEmail", 400)


class BadRequestError(Exception):
    """The request is malformed in a way that FastAPI does not already check. The message is for the log."""


def _failure(status_code: int, detail: str, code: str = DEFAULT_ERROR) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"data": {}, "errors": [{"error": code, "detail": detail}], "status": "failure"},
    )


class EmptyBodyError(BadRequestError):
    def __init__(self):
        super().__init__("The request body is empty")


def unexpected_error(request: Request, status_code: int, reason: str, exc_info: BaseException | None = None):
    """The response for something that should not happen, and an error in the log with the same code.

    The user is shown the code to give to support, who find the details (the reason) in the log.
    """
    code = f"u{secrets.token_hex(4)}"
    logger.error(
        "Unexpected error %s: %s %s gave %s: %s",
        code,
        request.method,
        request.url.path,
        status_code,
        reason,
        exc_info=exc_info,
    )
    settings = get_settings()
    language = negotiate_language(request.headers.get("accept-language"))
    detail = t(
        "unexpectedError",
        language,
        app_title=settings.application_title,
        code=code,
        support_email=settings.support_email,
    )
    return _failure(status_code, detail)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_error(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        # Errors FastAPI raises itself (401 from logged_in_user, 404, 405...) get the same shape as all the others
        response = _failure(exc.status_code, str(exc.detail))
        response.headers.update(exc.headers or {})
        return response

    @app.exception_handler(HintError)
    async def hint_error(request: Request, exc: HintError) -> JSONResponse:
        language = negotiate_language(request.headers.get("accept-language"))
        return _failure(exc.status_code, t(exc.key, language), exc.code)

    @app.exception_handler(RequestValidationError)
    async def invalid_request(request: Request, exc: RequestValidationError) -> JSONResponse:
        # Only where and why, not the values, which could be anything the user typed
        reason = "; ".join(f"{'.'.join(str(part) for part in e['loc'])}: {e['msg']}" for e in exc.errors())
        # A body that is not JSON (a form, say) is "unsupported media type", as in Kotlin
        content_type = request.headers.get("content-type", "")
        return unexpected_error(request, 415 if content_type and "json" not in content_type else 400, reason)

    @app.exception_handler(BadRequestError)
    async def bad_request(request: Request, exc: BadRequestError) -> JSONResponse:
        return unexpected_error(request, 400, str(exc))

    @app.exception_handler(Exception)
    async def unexpected(request: Request, exc: Exception) -> JSONResponse:
        # The stack trace stays in the log, it is not sent to the browser
        return unexpected_error(request, 500, repr(exc), exc_info=exc)
