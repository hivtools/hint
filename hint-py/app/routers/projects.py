"""Projects and their versions (Kotlin: ProjectsController).

All of these need a logged in user. An endpoint that names a project or version in its path takes it as `ProjectOfUser`
or `VersionOfUser`, which check that it is the user's before the endpoint runs. The version a browser tab is working on
is not kept in a session here: the tab sends it in the X-Version-Id header (see `requested_version_id`) and keeps track of it itself, so the endpoints that used to
set or clear the session's version just return.
"""

from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, Request

from app import schemas
from app.dependencies import (
    LoggedInUser,
    ParentVersionOfUser,
    ProjectOfUser,
    Projects,
    VersionOfUser,
    Versions,
    find_owned_version,
    requested_version_id,
)
from app.errors import EmptyBodyError
from app.ids import new_version_id
from app.schemas import SuccessResponse, empty_success, success
from app.services.project_service import ProjectService, get_project_service

log = structlog.get_logger()

router = APIRouter()

Service = Annotated[ProjectService, Depends(get_project_service)]


@router.post("/project")
async def new_project(
    body: schemas.NewProjectRequest, user: LoggedInUser, service: Service
) -> SuccessResponse[schemas.Project]:
    return success(await service.create_project(user.id, body.name, body.note, body.is_uploaded))


@router.post("/project/{project_id}/clone")
async def clone_project_to_user(
    project: ProjectOfUser, body: schemas.CloneProjectRequest, user: LoggedInUser, service: Service
) -> SuccessResponse[None]:
    await service.clone_project_to_user(user.id, project.id, body.emails)
    return success(None)


@router.post("/project/{project_id}/version")
async def new_version(
    parent: ParentVersionOfUser, body: schemas.NewVersionRequest, versions: Versions
) -> SuccessResponse[schemas.Version]:
    version_id = new_version_id()
    await versions.copy_version(parent.id, version_id, parent.project_id, body.note)
    return success(await versions.get_version(version_id))


@router.post("/project/{project_id}/version/{version_id}/state")
async def upload_state(version: VersionOfUser, request: Request, versions: Versions) -> SuccessResponse[bool]:
    # The state is stored exactly as it was sent, whatever the content type
    state = (await request.body()).decode("utf-8")
    if not state:
        raise EmptyBodyError
    await versions.save_version_state(version.id, state)
    return empty_success()


@router.post("/project/{project_id}/version/{version_id}/promote")
async def promote_version(
    version: VersionOfUser, body: schemas.PromoteVersionRequest, user: LoggedInUser, service: Service
) -> SuccessResponse[schemas.Project]:
    # Kotlin did not check the version, so a user could copy anyone's version (quirk 30 in contract-tests/QUIRKS.md, D15)
    return success(await service.promote_version(user.id, version.id, body.name, body.note))


@router.post("/project/{project_id}/note")
async def update_project_note(
    project: ProjectOfUser, body: schemas.NoteRequest, projects: Projects
) -> SuccessResponse[bool]:
    await projects.update_project_note(project.id, body.note)
    log.info("Updated project notes", project=project.id)
    return empty_success()


@router.post("/project/{project_id}/version/{version_id}/note")
async def update_version_note(
    version: VersionOfUser, body: schemas.NoteRequest, versions: Versions
) -> SuccessResponse[bool]:
    await versions.update_version_note(version.id, body.note)
    return empty_success()


@router.get("/project/{project_id}/version/{version_id}")
async def load_version_details(version: VersionOfUser, versions: Versions) -> SuccessResponse[schemas.VersionDetails]:
    return success(await versions.get_version_details(version.id))


# Only this URL, with the trailing slash, is the API. /projects without it is a page of the Vue app, which Kotlin
# serves, so do not add a route for it here (and see the nginx config)
@router.get("/projects/")
async def get_projects(user: LoggedInUser, projects: Projects) -> SuccessResponse[list[schemas.Project]]:
    return success(await projects.get_projects(user.id))


@router.delete("/project/{project_id}/version/{version_id}")
async def delete_version(version: VersionOfUser, versions: Versions) -> SuccessResponse[bool]:
    await versions.delete_version(version.id)
    return empty_success()


@router.delete("/project/{project_id}")
async def delete_project(project: ProjectOfUser, projects: Projects) -> SuccessResponse[bool]:
    await projects.delete_project(project.id)
    return empty_success()


@router.get("/project/current")
async def get_current_project(
    user: LoggedInUser,
    projects: Projects,
    versions: Versions,
    version_id: Annotated[str | None, Depends(requested_version_id)],
) -> SuccessResponse[schemas.CurrentProject]:
    owned = await find_owned_version(version_id, user, versions) if version_id else None
    if owned is None:
        return success(schemas.CurrentProject(project=None, version=None))
    version = await versions.get_version(owned.id)
    project = await projects.get_project(owned.project_id)
    return success(schemas.CurrentProject(project=project, version=version))


@router.post("/project/{project_id}/rename")
async def rename_project(
    project: ProjectOfUser, body: schemas.RenameProjectRequest, projects: Projects
) -> SuccessResponse[bool]:
    await projects.rename_project(project.id, body.name, body.note)
    return empty_success()
