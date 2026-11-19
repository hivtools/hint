"""A stand-in for hintr, for the tests of the client and of the endpoints that use it.

It is a transport that records the calls and answers as the test says, so nothing goes over the network. The answers and
failures the tests use are the ones recorded from the Kotlin app (contract-tests/tests/test_hintr_faults.py).
"""

from collections.abc import Callable
from dataclasses import dataclass, field

import httpx2

# A body with odd spacing, so that a test can tell hintr's own body from one that was read and written again
SUCCESS = b'{"status":"success",  "errors":null,"data":{"id":"t1"}}'
HINTR_FAILURE = {"status": "failure", "errors": [{"error": "SERVER_ERROR", "detail": "hintr exploded"}], "data": None}


def failure(detail: str) -> dict:
    """What hint answers when it has to make the failure up itself."""
    return {"data": {}, "errors": [{"detail": detail, "error": "OTHER_ERROR"}], "status": "failure"}


def success(data: object) -> dict:
    return {"data": data, "errors": [], "status": "success"}


@dataclass
class FakeHintr:
    calls: list[httpx2.Request] = field(default_factory=list)
    respond: Callable[[httpx2.Request], httpx2.Response] = lambda request: httpx2.Response(200, content=SUCCESS)
    http: httpx2.AsyncClient = field(init=False)

    def __post_init__(self):
        self.http = httpx2.AsyncClient(transport=httpx2.MockTransport(self._handler), base_url="http://hintr")

    def answer(self, status: int = 200, **kwargs):
        self.respond = lambda request: httpx2.Response(status, **kwargs)

    def fail_to_connect(self, error: Exception):
        def raise_it(request: httpx2.Request) -> httpx2.Response:
            raise error

        self.respond = raise_it

    def _handler(self, request: httpx2.Request) -> httpx2.Response:
        self.calls.append(request)
        return self.respond(request)
