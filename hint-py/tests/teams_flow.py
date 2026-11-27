"""A fake Teams flow, the place error reports are sent to (`issue_report_url`).

It is an HTTP transport, so no call goes over the network. It records each call and answers as the stub of the contract
tests does (`{"statusCode": 200, "description": "OK"}`), unless a test gives it another answer or makes the connection
fail.
"""

import json
from dataclasses import dataclass, field
from typing import Any

import httpx2

from tests.support import TEAMS_FLOW_SIG

# The address of the flow, with its key in it, as a real Power Automate address has
TEAMS_FLOW_URL = f"https://flow.example/workflows/abc/triggers/manual/paths/invoke?api-version=1&sig={TEAMS_FLOW_SIG}"
OK = {"statusCode": 200, "description": "OK"}


@dataclass
class FakeTeamsFlow:
    calls: list[httpx2.Request] = field(default_factory=list)
    answer: httpx2.Response | Exception = field(default_factory=lambda: httpx2.Response(200, json=OK))
    http: httpx2.AsyncClient = field(init=False)

    def __post_init__(self):
        self.http = httpx2.AsyncClient(transport=httpx2.MockTransport(self._handler))

    def reports(self) -> list[Any]:
        """The body of each call, read as JSON."""
        return [json.loads(call.content) for call in self.calls]

    def _handler(self, request: httpx2.Request) -> httpx2.Response:
        self.calls.append(request)
        if isinstance(self.answer, Exception):
            raise self.answer
        return self.answer
