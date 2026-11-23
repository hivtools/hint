"""The parameters of a request that can be in the query string or in a form.

The Vue app sends the parameters of some POST requests in the body, as a form (`qs.stringify` and a string body: axios
sends it as `application/x-www-form-urlencoded`). Other callers send them in the query string. Spring's `@RequestParam`
takes both, and the Kotlin app has such endpoints. An endpoint that takes `RequestParameters` takes both too. If a name is
in both, the query string wins. If a name is there more than once, the first value counts.
"""

from typing import Annotated
from urllib.parse import parse_qs

from fastapi import Depends, Request

from app.errors import FormTooLargeError, MissingParameterError

# A form of a few parameters is under 1 KB. The limit is for a body that is not.
MAX_FORM_BYTES = 64 * 1024


class RequestParameters:
    def __init__(self, query: dict[str, list[str]], form: dict[str, list[str]]):
        self._query = query
        self._form = form

    def get(self, name: str) -> str | None:
        """The value, or None if the request has no such parameter. An empty value is a value."""
        for found in (self._query, self._form):
            if name in found:
                return found[name][0]
        return None

    def required(self, name: str) -> str:
        """The value. Raises `MissingParameterError` (the usual 400) if the request has no such parameter."""
        value = self.get(name)
        if value is None:
            raise MissingParameterError(name)
        return value


async def request_parameters(request: Request) -> RequestParameters:
    query = parse_qs(request.url.query, keep_blank_values=True)
    form: dict[str, list[str]] = {}
    if request.headers.get("content-type", "").lower().startswith("application/x-www-form-urlencoded"):
        body = b""
        async for chunk in request.stream():
            body += chunk
            if len(body) > MAX_FORM_BYTES:
                raise FormTooLargeError
        form = parse_qs(body.decode("utf-8", errors="replace"), keep_blank_values=True)
    return RequestParameters(query, form)


Parameters = Annotated[RequestParameters, Depends(request_parameters)]
