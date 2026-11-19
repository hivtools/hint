from collections.abc import Sequence
from typing import Any

from sqlalchemy import Row, Select, insert, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas
from app.db.database import DbSession
from app.db.models import Project, ProjectVersion
from app.errors import ProjectDoesNotExistError

_PROJECT_WITH_VERSIONS = (
    select(
        Project.id,
        Project.name,
        Project.shared_by,
        Project.note,
        Project.is_uploaded,
        ProjectVersion.id.label("version_id"),
        ProjectVersion.created,
        ProjectVersion.updated,
        ProjectVersion.note.label("version_note"),
        ProjectVersion.version_number,
    )
    .select_from(Project)
    .join(ProjectVersion, Project.id == ProjectVersion.project_id)
)


class ProjectRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_new_project(
        self,
        user_id: str,
        project_name: str,
        shared_by: str | None = None,
        note: str | None = None,
        is_uploaded: bool | None = False,
    ) -> int:
        result = await self.session.execute(
            insert(Project)
            .values(user_id=user_id, name=project_name, shared_by=shared_by, note=note, is_uploaded=is_uploaded)
            .returning(Project.id)
        )
        return result.scalar_one()

    async def get_projects(self, user_id: str) -> list[schemas.Project]:
        """The user's projects, with their versions that have not been deleted, most recently updated first."""
        query = _PROJECT_WITH_VERSIONS.where(Project.user_id == user_id, ProjectVersion.deleted.is_(False)).order_by(
            ProjectVersion.updated.desc()
        )
        rows = await self._rows(query)
        by_project: dict[int, list[Row[*tuple[Any, ...]]]] = {}
        for row in rows:
            by_project.setdefault(row.id, []).append(row)
        # The rows are ordered by update time, so the projects come out in the order of their latest version
        return [_to_project(project_rows) for project_rows in by_project.values()]

    async def get_owner(self, project_id: int) -> str | None:
        """The user whose project it is. None for a project that does not exist."""
        return await self.session.scalar(select(Project.user_id).where(Project.id == project_id))

    async def get_project(self, project_id: int) -> schemas.Project:
        # Includes deleted versions, as the Kotlin app does
        # Oldest version first, which is how the Vue app adds a new version to the current project. Kotlin did not
        # order these, so it returned them in whatever order Postgres found them.
        query = _PROJECT_WITH_VERSIONS.where(Project.id == project_id).order_by(ProjectVersion.version_number)
        rows = await self._rows(query)
        if not rows:
            raise ProjectDoesNotExistError
        return _to_project(rows)

    async def delete_project(self, project_id: int) -> None:
        """Soft delete: marks every version deleted, nothing is removed."""
        await self.session.execute(
            update(ProjectVersion).where(ProjectVersion.project_id == project_id).values(deleted=True)
        )

    async def rename_project(self, project_id: int, name: str, note: str | None = None) -> None:
        await self.session.execute(update(Project).where(Project.id == project_id).values(name=name, note=note))

    async def update_project_note(self, project_id: int, note: str) -> None:
        await self.session.execute(update(Project).where(Project.id == project_id).values(note=note))

    async def _rows(self, query: Select[*tuple[Any, ...]]) -> Sequence[Row[*tuple[Any, ...]]]:
        result = await self.session.execute(query)
        return result.all()


def _to_project(rows: Sequence[Row[*tuple[Any, ...]]]) -> schemas.Project:
    first = rows[0]
    return schemas.Project(
        id=first.id,
        name=first.name,
        shared_by=first.shared_by,
        note=first.note,
        is_uploaded=first.is_uploaded,
        versions=[
            schemas.Version(
                id=row.version_id,
                created=row.created,
                updated=row.updated,
                version_number=row.version_number,
                note=row.version_note,
            )
            for row in rows
        ],
    )


def get_project_repository(db_session: DbSession) -> ProjectRepository:
    return ProjectRepository(db_session)
