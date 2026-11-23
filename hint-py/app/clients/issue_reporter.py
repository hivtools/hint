"""Where an error report goes: the support team's issue tracker.

Today this is a Microsoft Teams flow (Power Automate), at `issue_report_url`. It is to be replaced (by Freshdesk or
another helpdesk). The router does not depend on which: it calls `IssueReporter.send` and gives the browser the answer.
To change where reports go, add a class with a `send` method and return it from `get_issue_reporter`.
"""

from typing import Annotated, Protocol

import httpx2
import structlog
from fastapi import Depends, Header, Request
from pydantic import SecretStr
from pydantic_core import to_jsonable_python

from app.clients.responses import TIMEOUT_SECONDS, HintResponse, service_response
from app.config import Settings, get_settings
from app.messages import negotiate_language, t
from app.schemas import ErrorReport

log = structlog.get_logger()


def create_issue_report_http_client() -> httpx2.AsyncClient:
    # Does not connect yet. The first request does.
    return httpx2.AsyncClient(timeout=TIMEOUT_SECONDS)


class IssueReporter(Protocol):
    async def send(self, report: ErrorReport) -> HintResponse:
        """Sends the report. The answer is for the browser: a success if the report was taken, and a failure if not.
        The project is only copied to the support user after a success."""
        ...


class TeamsFlowReporter:
    """Posts the report, as JSON, to the Teams flow. The flow's answer is made into an answer of this API in the same
    way as hintr's (see `service_response`), as Kotlin did: the success has the flow's JSON as its data, which the Vue
    app does not read.
    """

    def __init__(self, http: httpx2.AsyncClient, url: SecretStr, language: str):
        self._http = http
        self._url = url
        self._language = language

    async def send(self, report: ErrorReport) -> HintResponse:
        url = self._url.get_secret_value()
        if not url:
            # A deployment that has not set it. Not for the user to act on, so an unexpected error.
            msg = "HINT_ISSUE_REPORT_URL is not set, so the error report cannot be sent"
            raise RuntimeError(msg)
        try:
            r = await self._http.post(url, json=to_jsonable_python(report, by_alias=True))
        except httpx2.RequestError:
            # Not log.exception: the message of the library has the address, which has the key of the flow in it
            log.error("No response from the issue report flow")  # noqa: TRY400
            return HintResponse.failure(500, t("noResponse", self._language))
        if r.is_success and not r.content:
            # A flow with no Response action answers 202 with no body
            return HintResponse.success(None, r.status_code)
        return service_response("issue report flow", r.status_code, r.content, self._language)


def get_issue_reporter(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
    accept_language: Annotated[str | None, Header()] = None,
) -> IssueReporter:
    return TeamsFlowReporter(
        request.app.state.issue_report_http, settings.issue_report_url, negotiate_language(accept_language)
    )


IssueReporting = Annotated[IssueReporter, Depends(get_issue_reporter)]
