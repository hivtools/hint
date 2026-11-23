from typing import Annotated

import structlog
from fastapi import Depends

from app import schemas
from app.db.project_repository import ProjectRepository, get_project_repository
from app.db.user_repository import UserRepository, get_user_repository
from app.db.version_repository import VersionRepository, get_version_repository
from app.dependencies import GUEST_USER
from app.errors import ProjectDoesNotExistError, UserDoesNotExistError
from app.ids import new_version_id

log = structlog.get_logger()


class ProjectService:
    def __init__(self, projects: ProjectRepository, versions: VersionRepository, users: UserRepository):
        self.projects = projects
        self.versions = versions
        self.users = users

    async def create_project(
        self, user_id: str, name: str, note: str | None, is_uploaded: bool | None
    ) -> schemas.Project:
        """A new project, with its first version."""
        project_id = await self.projects.save_new_project(user_id, name, note=note, is_uploaded=is_uploaded)
        version_id = new_version_id()
        await self.versions.save_version(version_id, project_id)
        version = await self.versions.get_version(version_id)
        # As in Kotlin, the project that is returned does not have the note
        return schemas.Project(id=project_id, name=name, versions=[version], is_uploaded=is_uploaded)

    async def promote_version(self, user_id: str, version_id: str, name: str, note: str | None) -> schemas.Project:
        """A new project, whose first version is a copy of this one (with its state and files).

        The caller has checked that the version is the user's."""
        project_id = await self.projects.save_new_project(user_id, name)
        promoted_version_id = new_version_id()
        await self.versions.copy_version(version_id, promoted_version_id, project_id, note)
        version = await self.versions.get_version(promoted_version_id)
        return schemas.Project(id=project_id, name=name, versions=[version])

    async def clone_project_to_user(self, user_id: str, project_id: int, emails: list[str]) -> None:
        """Gives each of the users a copy of the project (and all its versions), marked as shared by user_id. The caller
        has checked that the project is user_id's."""
        log.info("Cloning project", project=project_id, users=len(emails))
        target_user_ids = [await self._user_id(email) for email in emails]
        await self._clone(user_id, project_id, target_user_ids)

    async def copy_to_support_user(self, user_id: str, project_id: int, support_email: str) -> None:
        """Gives the support user a copy of a project of user_id, for an error report. The project is checked here: it
        comes from the body of the report.

        As in Kotlin, the support user is looked up first, so a missing support user is userDoesNotExist even when the
        project is not user_id's. A project that is not user_id's (or does not exist) is projectDoesNotExist. A guest
        has no projects."""
        log.info("Copying project to the support user", project=project_id)
        support_user_id = await self._user_id(support_email)
        if user_id == GUEST_USER or await self.projects.get_owner(project_id) != user_id:
            raise ProjectDoesNotExistError
        await self._clone(user_id, project_id, [support_user_id])

    async def _user_id(self, email: str) -> str:
        user_id = await self.users.find_user_id(email)
        if user_id is None:
            raise UserDoesNotExistError
        return user_id

    async def _clone(self, user_id: str, project_id: int, target_user_ids: list[str]) -> None:
        project = await self.projects.get_project(project_id)
        for target in target_user_ids:
            new_project_id = await self.projects.save_new_project(target, project.name, shared_by=user_id)
            for version in project.versions:
                await self.versions.clone_version(version.id, new_version_id(), new_project_id)


def get_project_service(
    projects: Annotated[ProjectRepository, Depends(get_project_repository)],
    versions: Annotated[VersionRepository, Depends(get_version_repository)],
    users: Annotated[UserRepository, Depends(get_user_repository)],
) -> ProjectService:
    return ProjectService(projects, versions, users)
