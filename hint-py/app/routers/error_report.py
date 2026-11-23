"""POST /error-report: the user reports an error to the support team (Kotlin: ErrorReportController).

The report is sent on (`IssueReporter`, app/clients/issue_reporter.py), and the browser gets the answer. If the report
was taken, and it names a project, the support user gets a copy of the project, so that they can look at it. A guest
may report too, but has no project to copy.

As in Kotlin:
- The report is sent first. A project that cannot be copied (not the user's, or the support user does not exist) is an
  error after the report has gone.
- Whether the reporter is the support user (who gets no copy of their own project) is decided by the email in the body,
  which the user typed, not by who is logged in. The project is still checked against who is logged in.
"""

from typing import Annotated

import structlog
from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.clients.issue_reporter import IssueReporting
from app.config import Settings, get_settings
from app.dependencies import User, current_user
from app.schemas import ErrorReport
from app.services.project_service import ProjectService, get_project_service

log = structlog.get_logger()

router = APIRouter(tags=["error report"])


@router.post("/error-report", response_model=None)
async def error_report(
    report: ErrorReport,
    user: Annotated[User, Depends(current_user)],
    reporter: IssueReporting,
    service: Annotated[ProjectService, Depends(get_project_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> Response:
    log.info("Sending an error report", project=report.project_id, guest=user.is_guest)
    answer = await reporter.send(report)
    if not answer.ok:
        log.error("The error report was not sent", project=report.project_id, status=answer.status_code)
        return answer.response()
    if report.project_id is not None and report.email != settings.support_email:
        await service.copy_to_support_user(user.id, report.project_id, settings.support_email)
    return answer.response()
