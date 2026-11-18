"""What the clients of hintr and ADR have in common.

Both services answer in their own way. These helpers turn what a service sent into an answer in the format of this API.
"""

import json
from http import HTTPStatus
from typing import Any

# How long to wait, in seconds. It applies to the connection, and to each wait for the next part of an answer.
TIMEOUT_SECONDS = 120


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


def failure_content(detail: str, code: str = "OTHER_ERROR") -> dict[str, Any]:
    """The body of a failed answer. It has the same format for every endpoint."""
    return {"data": {}, "errors": [{"error": code, "detail": detail}], "status": "failure"}
