"""The hintr API, the R service that validates inputs, builds chart data and runs the model.

hintr answers in the format the Vue app expects, so most answers are passed on as they are. What is not hintr's own
format is made to look like it (see `_hint_response`).
"""

import json
import logging
from collections.abc import Mapping
from http import HTTPStatus
from typing import Annotated
from urllib.parse import quote

import httpx2
from fastapi import Depends, Header, Request
from fastapi.responses import JSONResponse, Response

from app.config import Settings
from app.schemas import success

logger = logging.getLogger(__name__)

# How long to wait for a connection and an answer
TIMEOUT_SECONDS = 120

NO_RESPONSE = "No response returned. The request may have timed out."
UNPARSEABLE = "Could not parse response."


def create_hintr_http_client(settings: Settings) -> httpx2.AsyncClient:
    # Does not connect yet, the first request does
    return httpx2.AsyncClient(base_url=settings.hintr_url, timeout=TIMEOUT_SECONDS)


def _failure(status_code: int, detail: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"data": {}, "errors": [{"error": "OTHER_ERROR", "detail": detail}], "status": "failure"},
    )


def _hint_status(hintr_status: int) -> int:
    """Statuses up to 404 are passed on, anything else (and anything that is not a real status) is a 500."""
    try:
        HTTPStatus(hintr_status)
    except ValueError:
        return 500
    return hintr_status if hintr_status <= HTTPStatus.NOT_FOUND else 500


def _parse_json(body: bytes) -> tuple[bool, object]:
    try:
        return True, json.loads(body.decode("utf-8"))
    except ValueError:  # includes a body that is not UTF-8
        return False, None


def _hint_response(hintr_status: int, body: bytes) -> Response:
    """hintr's answer, in the format of every hint answer.

    An answer with a `status` field is already in that format, and is passed on as it is. Anything else is wrapped: a
    success if hintr said so, otherwise a failure with the answer as the message. An answer that is not JSON is
    "Could not parse response".
    """
    status = _hint_status(hintr_status)
    is_json, parsed = _parse_json(body)
    if not is_json:
        logger.error("hintr answered %s with something that is not JSON: %r", hintr_status, body[:200])
        return _failure(500, UNPARSEABLE)

    if isinstance(parsed, dict) and "status" in parsed:
        return Response(content=body, status_code=status, media_type="application/json")
    if status < 400:
        return JSONResponse(content=success(parsed).model_dump(), status_code=status)
    # The text of a string, and the JSON of anything else
    message = parsed if isinstance(parsed, str) else json.dumps(parsed)
    logger.error(message)
    return _failure(status, message)


class HintrClient:
    """Calls to hintr on behalf of one request, so they carry that request's language (hintr translates its messages).

    It returns the response to send back to the browser.
    """

    def __init__(self, http: httpx2.AsyncClient, language: str):
        self._http = http
        self._language = language

    async def forward(self, method: str, path: str, params: Mapping[str, str] | None = None) -> Response:
        """Call hintr and return its answer. The {names} in the path are filled in from `params`, made safe first: a
        value from the URL cannot add path parts or a query string to the call."""
        path = path.format_map({name: quote(value, safe="") for name, value in (params or {}).items()})
        try:
            r = await self._http.request(method, path, headers={"Accept-Language": self._language})
        except httpx2.RequestError:
            logger.exception("No response from hintr for %s %s", method, path)
            return _failure(500, NO_RESPONSE)
        return _hint_response(r.status_code, r.content)


def get_hintr_client(request: Request, accept_language: Annotated[str | None, Header()] = None) -> HintrClient:
    # The Accept-Language header is passed on as it is, hintr understands it (and "en" if there is none)
    return HintrClient(request.app.state.hintr_http, accept_language or "en")


Hintr = Annotated[HintrClient, Depends(get_hintr_client)]
