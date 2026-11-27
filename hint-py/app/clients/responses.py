"""What the clients of hintr, ADR and the error report flow have in common.

Each service answers in its own way. Each client turns what its service sent into a `HintResponse`, an answer in the
format of this API. The helpers here are what the clients use to do that.
"""

import json
from dataclasses import dataclass
from http import HTTPStatus
from typing import Any

import httpx2
import structlog
from fastapi.responses import JSONResponse, Response

from app.messages import t

log = structlog.get_logger()

# How long to wait, in seconds. It applies to the connection, and to each wait for the next part of an answer.
TIMEOUT_SECONDS = 120

DEFAULT_ERROR = "OTHER_ERROR"


@dataclass(frozen=True)
class HintResponse:
    """An answer in the format of this API: a status code, and the envelope `{"data", "errors", "status"}` that the Vue
    app reads.

    The envelope is a dict, or the JSON text of one. Text is sent to the browser byte for byte, so an answer of hintr
    that is already in this format is not read and written again. It is read only when `data` is.

    The code that makes an answer returns this. The router turns it into the response for the browser with `response()`.
    """

    status_code: int
    body: dict[str, Any] | bytes

    @classmethod
    def success(cls, data: object, status_code: int = 200) -> HintResponse:
        return cls(status_code, {"data": data, "errors": [], "status": "success"})

    @classmethod
    def success_from_json(cls, data: bytes) -> HintResponse:
        """A success whose data is already JSON text. The text is put inside the envelope as it is: parsing it and
        writing it out again costs a lot of time and memory when it is large."""
        return cls(200, b'{"data":' + data + b',"errors":[],"status":"success"}')

    @classmethod
    def failure(cls, status_code: int, detail: str, code: str = DEFAULT_ERROR) -> HintResponse:
        """A failure with one error. Every failure of this API has this format."""
        return cls(status_code, {"data": {}, "errors": [{"error": code, "detail": detail}], "status": "failure"})

    @classmethod
    def from_service(cls, answer: httpx2.Response, language: str) -> HintResponse:
        """The answer of a service (hintr, or the error report flow), in the format of every answer of this API.

        An answer that has a `status` field already has that format. It goes to the browser as it is. Any other answer
        is wrapped: it is a success if the service said so, and if not, it is a failure that has the answer as its
        message. An answer that is not JSON is a failure with the message "Could not parse response".

        The body must have been read. The log names the service by the host and path that were called.
        """
        status = hint_status(answer.status_code)
        is_json, parsed = parse_json(answer.content)
        called = {"host": answer.request.url.host, "path": answer.request.url.path, "status": answer.status_code}
        if not is_json:
            log.error("A service answered with something that is not JSON", **called, body=repr(answer.content[:200]))
            return cls.failure(500, t("unparseableResponse", language))

        if isinstance(parsed, dict) and "status" in parsed:
            return cls(status, answer.content)
        if status < HTTPStatus.BAD_REQUEST:
            return cls.success(parsed, status)
        # A string is the message as it is. Any other JSON becomes text.
        message = parsed if isinstance(parsed, str) else json.dumps(parsed)
        log.error("A service failed", **called, message=message)
        return cls.failure(status, message)

    @property
    def ok(self) -> bool:
        return self.status_code < HTTPStatus.BAD_REQUEST

    @property
    def envelope(self) -> dict[str, Any]:
        return json.loads(self.body) if isinstance(self.body, bytes) else self.body

    @property
    def data(self) -> Any:
        return self.envelope["data"]

    def response(self) -> Response:
        if isinstance(self.body, bytes):
            return Response(content=self.body, status_code=self.status_code, media_type="application/json")
        # FastAPI sends this JSON as it is. It does not check or convert it again. This matters for a long list of
        # datasets.
        return JSONResponse(status_code=self.status_code, content=self.body)


def hint_status(service_status: int) -> int:
    """The status to send to the browser for the status of a service.

    A status up to 404 stays as it is. Any other status becomes 500. So does a number that is not a status.
    """
    try:
        HTTPStatus(service_status)
    except ValueError:
        return 500
    return service_status if service_status <= HTTPStatus.NOT_FOUND else 500


def parse_json(body: bytes) -> tuple[bool, Any]:
    """`(True, value)` if the body is JSON, and `(False, None)` if it is not."""
    try:
        return True, json.loads(body.decode("utf-8"))
    except ValueError:  # This includes a body that is not UTF-8.
        return False, None
