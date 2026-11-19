"""What the clients of hintr and ADR have in common.

Both services answer in their own way. Each client turns what its service sent into a `HintResponse`, an answer in the
format of this API. The helpers here are what both clients use to do that.
"""

import json
from dataclasses import dataclass
from http import HTTPStatus
from typing import Any

from fastapi.responses import JSONResponse, Response

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
