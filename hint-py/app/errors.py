"""Errors in the format the Vue app expects: {"status": "failure", "data": {}, "errors": [{"error": ..., "detail": ...}]}.

`detail` is translated using the Accept-Language header. Raise a HintError (or one of its subclasses) for an error the
user should see; anything else that goes wrong is reported as an "unexpected error" with a code to quote to support.
"""

import secrets

import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.messages import negotiate_language, t

log = structlog.get_logger()

DEFAULT_ERROR = "OTHER_ERROR"


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


class LoadFailedError(HintError):
    """The files to set for a version include one that was never uploaded."""

    def __init__(self):
        super().__init__("loadFailed", 400)


class MissingShapeFileError(HintError):
    def __init__(self):
        super().__init__("missingShapeFile", 400)


class UserDoesNotExistError(HintError):
    def __init__(self):
        super().__init__("userDoesNotExist", 400)


class InvalidEmailError(HintError):
    def __init__(self):
        super().__init__("invalidEmail", 400)


class MissingCalibrateDataError(HintError):
    """hintr has a calibration, but its results database is not in the results folder."""

    def __init__(self):
        super().__init__("missingCalibrateData", 400)


class MissingResultFileError(Exception):
    """hintr has a download, but its file is not in the results folder. Not for the user to act on, so it is reported as
    an unexpected error, and what is missing is in the log."""


class HintrFailedError(Exception):
    """A call to hintr that this API needed the answer of did not succeed. The response is hintr's own failure, as it
    is sent to the browser for any call that is passed on."""

    def __init__(self, response: Response):
        super().__init__(f"hintr answered {response.status_code}")
        self.response = response


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


class EmptyFileNameError(BadRequestError):
    def __init__(self):
        super().__init__("The uploaded file has no name")


class NullInFileNameError(BadRequestError):
    def __init__(self):
        super().__init__("The name of the uploaded file has a null character in it")


class UnknownInputTimeSeriesTypeError(HintError):
    def __init__(self):
        super().__init__("unknownInputTimeSeriesType", 400)


class UnknownReviewInputFileTypeError(HintError):
    def __init__(self):
        super().__init__("unknownReviewInputFileType", 400)


def hint_error_response(exc: HintError, accept_language: str | None) -> JSONResponse:
    """The response for an error, for an endpoint that has to answer with it rather than raise it. A raised error rolls back
    the request's changes to the database, and an answer does not."""
    return _failure(exc.status_code, t(exc.key, negotiate_language(accept_language)), exc.code)


def unexpected_error(request: Request, status_code: int, reason: str, exc_info: BaseException | None = None):
    """The response for something that should not happen, and an error in the log with the same code.

    The user is shown the code to give to support, who find the details (the reason) in the log.
    """
    code = f"u{secrets.token_hex(4)}"
    log.error(
        "Unexpected error",
        code=code,
        method=request.method,
        path=request.url.path,
        status=status_code,
        reason=reason,
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
        return hint_error_response(exc, request.headers.get("accept-language"))

    @app.exception_handler(HintrFailedError)
    async def hintr_failed(request: Request, exc: HintrFailedError) -> Response:
        return exc.response

    @app.exception_handler(RequestValidationError)
    async def invalid_request(request: Request, exc: RequestValidationError) -> JSONResponse:
        # Only where and why, not the values, which could be anything the user typed
        reason = "; ".join(f"{'.'.join(str(part) for part in e['loc'])}: {e['msg']}" for e in exc.errors())
        # A body that is not JSON (a form, say) is "unsupported media type", as in Kotlin. A file upload is not, but
        # an upload with no file in it is a bad request, as it is in Kotlin
        content_type = request.headers.get("content-type", "")
        unsupported = content_type and "json" not in content_type and "multipart/form-data" not in content_type
        return unexpected_error(request, 415 if unsupported else 400, reason)

    @app.exception_handler(BadRequestError)
    async def bad_request(request: Request, exc: BadRequestError) -> JSONResponse:
        return unexpected_error(request, 400, str(exc))

    @app.exception_handler(Exception)
    async def unexpected(request: Request, exc: Exception) -> JSONResponse:
        # The stack trace stays in the log, it is not sent to the browser
        return unexpected_error(request, 500, repr(exc), exc_info=exc)
