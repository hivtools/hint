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
from app.utils.byte_limit import MB

log = structlog.get_logger()


class HintError(Exception):
    def __init__(
        self,
        key: str,
        status_code: int = 500,
        code: str = DEFAULT_ERROR,
        arguments: dict[str, str] | None = None,
        headers: dict[str, str] | None = None,
    ):
        super().__init__(f"HintError with key {key}")
        self.key = key
        self.status_code = status_code
        self.code = code
        # What fills in the {placeholders} of the message
        self.arguments = arguments or {}
        # Headers to add to the response, such as WWW-Authenticate for a 401
        self.headers = headers or {}

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
    """An uploaded or imported file is bigger than the limit for its kind of file (see `INPUT_FILE_TYPES`)."""

    def __init__(self, max_bytes: int):
        super().__init__("fileTooLarge", 413, "FILE_TOO_LARGE", {"max_size": f"{max_bytes // MB} MB"})


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


class FailedZipRehydrateError(HintError):
    """The zip is not an output zip that this app made: it is not a zip, it has no project state, or the state cannot be
    read (see `app/services/rehydrate_service.py`)."""

    def __init__(self):
        super().__init__("failedZipRehydrate", 400)


class RehydrateMissingInputFileError(HintError):
    """An input file that the project state names is not in the uploads folder."""

    def __init__(self):
        super().__init__("rehydrateMissingInputFile", 400)


class RehydrateModelFitIdUnknownError(HintError):
    """The model fit in the project state is not a task that hintr knows."""

    def __init__(self):
        super().__init__("rehydrateModelFitIdUnknown", 400)


class RehydrateCalibrateIdUnknownError(HintError):
    """The calibration in the project state is not a task that hintr knows."""

    def __init__(self):
        super().__init__("rehydrateCalibrateIdUnknown", 400)


class MissingResultFileError(Exception):
    """hintr has a download, but its file is not in the results folder. Not for the user to act on, so it is reported as
    an unexpected error, and what is missing is in the log."""


class HintrFailedError(Exception):
    """A call to hintr that this API needed the answer of did not succeed. The answer is hintr's own failure, which is
    sent to the browser as it is for any call that is passed on."""

    def __init__(self, answer: HintResponse):
        super().__init__(f"hintr answered {answer.status_code}")
        self.answer = answer


class MissingUploadFileError(Exception):
    """A file of the version is in the database, but not in the uploads folder. Not for the user to act on, so it is
    reported as an unexpected error, and what is missing is in the log."""


class BadRequestError(Exception):
    """The request is malformed in a way that FastAPI does not already check. The message is for the log."""


class MissingParameterError(BadRequestError):
    def __init__(self, name: str):
        super().__init__(f"Required request parameter '{name}' is not present")


class FormTooLargeError(BadRequestError):
    def __init__(self):
        super().__init__("The form in the request body is too large")


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


class NotOnAdrError(HintError):
    """The link of a file to import is not an http or https address under ADR's address (see `AdrClient.file_at`)."""

    def __init__(self, link: str):
        super().__init__("notOnAdr", 400, arguments={"resource": link})


class InvalidResourceTypeError(HintError):
    """The resource type to push to ADR is not one that this app has (see `app/services/file_types.py`)."""

    def __init__(self):
        super().__init__("invalidResourceType", 400)


class DescriptionRequiredError(HintError):
    """A file of the outputs is pushed without a description."""

    def __init__(self):
        super().__init__("descriptionRequired", 400)


class ResourceIdRequiredError(HintError):
    """An input file is pushed without the id of the resource that it replaces."""

    def __init__(self):
        super().__init__("resourceIdRequired", 400)


class FileDoesNotExistError(HintError):
    """The version has no input file of the type to push."""

    def __init__(self):
        super().__init__("fileDoesNotExist", 400)


class AdrHashUnavailableError(HintError):
    """ADR did not give the hash of the resource, so the file cannot be compared with it. The reason is not shown: it can
    be any failure of ADR."""

    def __init__(self):
        super().__init__("adrHashUnavailable", 500)


class AdrResourceError(HintError):
    """ADR did not give the file. The status is the status of ADR's answer if that is an error status, and 500 if not."""

    def __init__(self, adr_status: int, link: str):
        status = adr_status if 400 <= adr_status < 600 else 500
        super().__init__("adrResourceError", status, arguments={"resource": link})


class NoPermissionToAccessResourceError(HintError):
    """ADR answered with a web page and not with the file. ADR shows its login page to a user who may not see the file."""

    def __init__(self):
        super().__init__("noPermissionToAccessResource", 403)


class NoResponseFromAdrError(HintError):
    """ADR did not answer: the connection failed or timed out."""

    def __init__(self):
        super().__init__("noResponse", 500)


class GitHubTokenRequiredError(HintError):
    """The request has no GitHub token. It must be in the Authorization header, as "Bearer <token>"."""

    def __init__(self):
        super().__init__("githubTokenRequired", 401, headers={"WWW-Authenticate": "Bearer"})


class GitHubTokenInvalidError(HintError):
    """GitHub does not accept the token. It is wrong, it has expired, or it was revoked."""

    def __init__(self):
        super().__init__("githubTokenInvalid", 401, headers={"WWW-Authenticate": 'Bearer error="invalid_token"'})


class NotInGitHubTeamError(HintError):
    """The token's user is not a member of the GitHub team that may come in. No team is set, or GitHub says no, or the
    token cannot read the team."""

    def __init__(self):
        super().__init__("notInGitHubTeam", 403)


class GitHubFailedError(HintError):
    """GitHub did not answer, or did not answer as expected, so the token could not be checked."""

    def __init__(self):
        super().__init__("githubFailed", 502)


class UnknownInputTimeSeriesTypeError(HintError):
    def __init__(self):
        super().__init__("unknownInputTimeSeriesType", 400)


class UnknownReviewInputFileTypeError(HintError):
    def __init__(self):
        super().__init__("unknownReviewInputFileType", 400)


def hint_error_response(exc: HintError, accept_language: str | None) -> Response:
    """Returns the response for an error. Use it when an endpoint must answer with the error and not raise it.

    A raised error rolls back the database changes of the request. An answer does not."""
    response = exc.hint_response(accept_language).response()
    response.headers.update(exc.headers)
    return response


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
