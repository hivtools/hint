"""Projects and their versions (Kotlin: ProjectsController).

All of these need a logged in user. The version a browser tab is working on is not kept in a session here: the tab sends
it in the X-Version-Id header (see `requested_version_id`) and keeps track of it itself, so the endpoints that used to
set or clear the session's version just return.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app import schemas
from app.db.project_repository import ProjectRepository, get_project_repository
from app.db.version_repository import VersionRepository, get_version_repository
from app.dependencies import User, logged_in_user, requested_version_id
from app.errors import EmptyBodyError
from app.ids import new_version_id
from app.schemas import SuccessResponse, empty_success, success
from app.services.project_service import ProjectService, get_project_service

logger = logging.getLogger(__name__)

router = APIRouter()

LoggedInUser = Annotated[User, Depends(logged_in_user)]
Projects = Annotated[ProjectRepository, Depends(get_project_repository)]
Versions = Annotated[VersionRepository, Depends(get_version_repository)]
Service = Annotated[ProjectService, Depends(get_project_service)]


@router.post("/project")
async def new_project(
    body: schemas.NewProjectRequest, user: LoggedInUser, service: Service
) -> SuccessResponse[schemas.Project]:
    return success(await service.create_project(user.id, body.name, body.note, body.is_uploaded))


@router.post("/project/{project_id}/clone")
async def clone_project_to_user(
    project_id: int, body: schemas.CloneProjectRequest, user: LoggedInUser, service: Service
) -> SuccessResponse[None]:
    await service.clone_project_to_user(user.id, project_id, body.emails)
    return success(None)


@router.post("/project/{project_id}/version")
async def new_version(
    project_id: int, body: schemas.NewVersionRequest, user: LoggedInUser, versions: Versions
) -> SuccessResponse[schemas.Version]:
    version_id = new_version_id()
    await versions.copy_version(body.parent, version_id, project_id, user.id, body.note)
    return success(await versions.get_version(version_id))


@router.post("/project/{project_id}/version/{version_id}/state")
async def upload_state(
    project_id: int, version_id: str, request: Request, user: LoggedInUser, versions: Versions
) -> SuccessResponse[bool]:
    # The state is stored exactly as it was sent, whatever the content type
    state = (await request.body()).decode("utf-8")
    if not state:
        raise EmptyBodyError
    await versions.save_version_state(version_id, project_id, user.id, state)
    return empty_success()


@router.post("/project/{project_id}/version/{version_id}/promote")
async def promote_version(
    project_id: int, version_id: str, body: schemas.PromoteVersionRequest, user: LoggedInUser, service: Service
) -> SuccessResponse[schemas.Project]:
    return success(await service.promote_version(user.id, version_id, body.name, body.note))


@router.post("/project/{project_id}/note")
async def update_project_note(
    project_id: int, body: schemas.NoteRequest, user: LoggedInUser, projects: Projects
) -> SuccessResponse[bool]:
    await projects.update_project_note(project_id, user.id, body.note)
    logger.info("updated project notes (project %s, user %s)", project_id, user.id)
    return empty_success()


@router.post("/project/{project_id}/version/{version_id}/note")
async def update_version_note(
    project_id: int, version_id: str, body: schemas.NoteRequest, user: LoggedInUser, versions: Versions
) -> SuccessResponse[bool]:
    await versions.update_version_note(version_id, project_id, user.id, body.note)
    return empty_success()


@router.get("/project/{project_id}/version/{version_id}")
async def load_version_details(
    project_id: int, version_id: str, user: LoggedInUser, versions: Versions
) -> SuccessResponse[schemas.VersionDetails]:
    return success(await versions.get_version_details(version_id, project_id, user.id))


# Only this URL, with the trailing slash, is the API. /projects without it is a page of the Vue app, which Kotlin
# serves, so do not add a route for it here (and see the nginx config)
@router.get("/projects/")
async def get_projects(user: LoggedInUser, projects: Projects) -> SuccessResponse[list[schemas.Project]]:
    return success(await projects.get_projects(user.id))


@router.delete("/project/{project_id}/version/{version_id}")
async def delete_version(
    project_id: int, version_id: str, user: LoggedInUser, versions: Versions
) -> SuccessResponse[bool]:
    await versions.delete_version(version_id, project_id, user.id)
    return empty_success()


@router.delete("/project/{project_id}")
async def delete_project(project_id: int, user: LoggedInUser, projects: Projects) -> SuccessResponse[bool]:
    await projects.delete_project(project_id, user.id)
    return empty_success()


@router.get("/project/current")
async def get_current_project(
    user: LoggedInUser,
    projects: Projects,
    versions: Versions,
    version_id: Annotated[str | None, Depends(requested_version_id)],
) -> SuccessResponse[schemas.CurrentProject]:
    if version_id is None or not await versions.version_exists(version_id, user.id):
        return success(schemas.CurrentProject(project=None, version=None))
    version = await versions.get_version(version_id)
    project = await projects.get_project_from_version_id(version_id, user.id)
    return success(schemas.CurrentProject(project=project, version=version))


@router.post("/project/{project_id}/rename")
async def rename_project(
    project_id: int, body: schemas.RenameProjectRequest, user: LoggedInUser, projects: Projects
) -> SuccessResponse[bool]:
    await projects.rename_project(project_id, user.id, body.name, body.note)
    return empty_success()
