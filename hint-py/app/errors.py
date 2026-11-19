"""Errors in the format the Vue app expects: {"status": "failure", "data": {}, "errors": [{"error": ..., "detail": ...}]}.

`detail` is translated using the Accept-Language header. Raise a HintError (or one of its subclasses) for an error the
user should see; anything else that goes wrong is reported as an "unexpected error" with a code to quote to support.
"""

import secrets

import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import Response
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.clients.responses import DEFAULT_ERROR, HintResponse
from app.config import get_settings
from app.messages import negotiate_language, t

log = structlog.get_logger()


class HintError(Exception):
    def __init__(
        self, key: str, status_code: int = 500, code: str = DEFAULT_ERROR, arguments: dict[str, str] | None = None
    ):
        super().__init__(f"HintError with key {key}")
        self.key = key
        self.status_code = status_code
        self.code = code
        # What fills in the {placeholders} of the message
        self.arguments = arguments or {}

    def hint_response(self, accept_language: str | None) -> HintResponse:
        """The failure that the user sees, in the language of the request."""
        return HintResponse.failure(
            self.status_code, t(self.key, negotiate_language(accept_language), **self.arguments), self.code
        )


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
    """One of the files to set for the version was never uploaded."""

    def __init__(self):
        super().__init__("loadFailed", 400)


class MissingShapeFileError(HintError):
    def __init__(self):
        super().__init__("missingShapeFile", 400)


class FileTooLargeError(HintError):
    """An uploaded file is bigger than the limit for its kind of file (`max_pjnz_upload_bytes` and the others)."""

    def __init__(self, max_bytes: int):
        super().__init__("fileTooLarge", 413, "FILE_TOO_LARGE", {"max_size": f"{max_bytes // (1024 * 1024)} MB"})


class InvalidFileExtensionError(HintError):
    """The extension of an uploaded file is not one that its type of file has (hintr would refuse it too)."""

    def __init__(self, expected: list[str], got: str):
        super().__init__(
            "invalidFileExtension", 400, "INVALID_FILE_EXTENSION", {"expected": ", ".join(expected), "got": got}
        )


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
    """A call to hintr that this API needed the answer of did not succeed. The answer is hintr's own failure, which is
    sent to the browser as it is for any call that is passed on."""

    def __init__(self, answer: HintResponse):
        super().__init__(f"hintr answered {answer.status_code}")
        self.answer = answer


class BadRequestError(Exception):
    """The request is malformed in a way that FastAPI does not already check. The message is for the log."""


class EmptyBodyError(BadRequestError):
    def __init__(self):
        super().__init__("The request body is empty")


class EmptyFileNameError(BadRequestError):
    def __init__(self):
        super().__init__("The uploaded file has no name")


class NullInFileNameError(BadRequestError):
    def __init__(self):
        super().__init__("The name of the uploaded file contains a null character")


class NoAdrCredentialsError(HintError):
    """ADR cannot be called, because the request has no credential for it.

    A user who logged in with single sign-on has an access token. In development, `adr_api_key` is the credential. The
    request has neither.
    """

    def __init__(self):
        super().__init__("noADRKey", 400)


class AdrFetchingDatasetsError(HintError):
    """ADR did not give the list of datasets. The status is the status of the answer of ADR, as the ADR client made it.

    ADR refuses a user who has never logged in to ADR itself, and its message says so. That user is told what to do.
    """

    def __init__(self, status_code: int, no_account: bool):
        super().__init__("adrFetchingDatasetsNoAccountError" if no_account else "adrFetchingDatasetsError", status_code)


class UnknownInputTimeSeriesTypeError(HintError):
    def __init__(self):
        super().__init__("unknownInputTimeSeriesType", 400)


class UnknownReviewInputFileTypeError(HintError):
    def __init__(self):
        super().__init__("unknownReviewInputFileType", 400)


def hint_error_response(exc: HintError, accept_language: str | None) -> Response:
    """Returns the response for an error. Use it when an endpoint must answer with the error and not raise it.

    A raised error rolls back the database changes of the request. An answer does not."""
    return exc.hint_response(accept_language).response()


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
    return HintResponse.failure(status_code, detail).response()


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_error(request: Request, exc: StarletteHTTPException) -> Response:
        # Errors FastAPI raises itself (401 from logged_in_user, 404, 405...) get the same shape as all the others
        response = HintResponse.failure(exc.status_code, str(exc.detail)).response()
        response.headers.update(exc.headers or {})
        return response

    @app.exception_handler(HintError)
    async def hint_error(request: Request, exc: HintError) -> Response:
        return hint_error_response(exc, request.headers.get("accept-language"))

    @app.exception_handler(HintrFailedError)
    async def hintr_failed(request: Request, exc: HintrFailedError) -> Response:
        return exc.answer.response()

    @app.exception_handler(RequestValidationError)
    async def invalid_request(request: Request, exc: RequestValidationError) -> Response:
        # Only where and why, not the values, which could be anything the user typed
        reason = "; ".join(f"{'.'.join(str(part) for part in e['loc'])}: {e['msg']}" for e in exc.errors())
        # A body that is not JSON (a form, for example) is "unsupported media type", as in Kotlin. A file upload is the
        # exception: it is multipart form data. An upload with no file in it is a bad request, as in Kotlin.
        content_type = request.headers.get("content-type", "")
        unsupported = content_type and "json" not in content_type and "multipart/form-data" not in content_type
        return unexpected_error(request, 415 if unsupported else 400, reason)

    @app.exception_handler(BadRequestError)
    async def bad_request(request: Request, exc: BadRequestError) -> Response:
        return unexpected_error(request, 400, str(exc))

    @app.exception_handler(Exception)
    async def unexpected(request: Request, exc: Exception) -> Response:
        # The stack trace stays in the log, it is not sent to the browser
        return unexpected_error(request, 500, repr(exc), exc_info=exc)
