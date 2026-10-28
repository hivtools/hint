from collections.abc import Mapping

from sqlalchemy import Integer, String, delete, func, insert, literal, select, update

from app import schemas
from app.db.database import DbSession
from app.db.models import Project, ProjectVersion, VersionFile
from app.errors import VersionDoesNotExistError


class VersionRepository:
    def __init__(self, db_session: DbSession):
        self.db_session = db_session

    async def save_version(self, version_id: str, project_id: int | None, note: str | None = None) -> None:
        """Creates the version if there is not one with this id yet."""
        existing = await self.db_session.scalar(select(ProjectVersion.id).where(ProjectVersion.id == version_id))
        if existing is None:
            await self.db_session.execute(
                insert(ProjectVersion).values(
                    id=version_id,
                    note=note,
                    project_id=project_id,
                    version_number=await self._next_version_number(project_id),
                )
            )

    async def get_version(self, version_id: str) -> schemas.Version:
        result = await self.db_session.execute(
            select(
                ProjectVersion.id,
                ProjectVersion.created,
                ProjectVersion.updated,
                ProjectVersion.version_number,
                ProjectVersion.note,
            ).where(ProjectVersion.id == version_id)
        )
        row = result.one_or_none()
        if row is None:
            raise VersionDoesNotExistError
        return schemas.Version(
            id=row.id, created=row.created, updated=row.updated, version_number=row.version_number, note=row.note
        )

    async def get_version_details(self, version_id: str, project_id: int, user_id: str) -> schemas.VersionDetails:
        await self._check_version_exists(version_id, project_id, user_id)
        files = await self.get_version_files(version_id)
        state = await self.db_session.scalar(select(ProjectVersion.state).where(ProjectVersion.id == version_id))
        # A version that has never had its state saved has no state to return, which is an error (as in Kotlin)
        return schemas.VersionDetails(state=state, files=files)  # ty: ignore[invalid-argument-type]

    async def save_version_state(self, version_id: str, project_id: int, user_id: str, state: str) -> None:
        await self._check_version_exists(version_id, project_id, user_id)
        await self.db_session.execute(update(ProjectVersion).where(ProjectVersion.id == version_id).values(state=state))

    async def update_version_note(self, version_id: str, project_id: int, user_id: str, note: str) -> None:
        await self._check_version_exists(version_id, project_id, user_id)
        await self.db_session.execute(update(ProjectVersion).where(ProjectVersion.id == version_id).values(note=note))

    async def delete_version(self, version_id: str, project_id: int, user_id: str) -> None:
        """Soft delete."""
        await self._check_version_exists(version_id, project_id, user_id)
        await self.db_session.execute(
            update(ProjectVersion).where(ProjectVersion.id == version_id).values(deleted=True)
        )

    async def version_exists(self, version_id: str, user_id: str) -> bool:
        result = await self.db_session.execute(
            select(ProjectVersion.id)
            .join(Project, ProjectVersion.project_id == Project.id)
            .where(ProjectVersion.id == version_id, Project.user_id == user_id)
        )
        return result.one_or_none() is not None

    async def copy_version(
        self, parent_version_id: str, new_version_id: str, project_id: int, user_id: str, note: str | None = None
    ) -> None:
        """A new version of the project, with the state and files of the parent version."""
        await self._check_version_exists(parent_version_id, project_id, user_id)
        await self._insert_with_parent_state(
            parent_version_id, new_version_id, project_id, note, await self._next_version_number(project_id)
        )
        await self._copy_files(parent_version_id, new_version_id)

    async def promote_version(
        self, parent_version_id: str, new_version_id: str, new_project_id: int, user_id: str, note: str | None = None
    ) -> None:
        """The first version of a new project, with the state and files of the parent version.

        As in Kotlin, this does not check that the parent version exists or that it is the user's (user_id is unused).
        """
        await self._insert_with_parent_state(
            parent_version_id, new_version_id, new_project_id, note, await self._next_version_number(new_project_id)
        )
        await self._copy_files(parent_version_id, new_version_id)

    async def clone_version(
        self, parent_version_id: str, new_version_id: str, new_project_id: int, note: str | None = None
    ) -> None:
        """Copies a version into another (user's) project, including its version number and dates."""
        await self.db_session.execute(
            insert(ProjectVersion).from_select(
                [
                    ProjectVersion.project_id,
                    ProjectVersion.id,
                    ProjectVersion.note,
                    ProjectVersion.version_number,
                    ProjectVersion.state,
                    ProjectVersion.created,
                    ProjectVersion.updated,
                ],
                select(
                    literal(new_project_id, Integer),
                    literal(new_version_id, String),
                    literal(note, String),
                    ProjectVersion.version_number,
                    ProjectVersion.state,
                    ProjectVersion.created,
                    ProjectVersion.updated,
                ).where(ProjectVersion.id == parent_version_id),
            )
        )
        await self._copy_files(parent_version_id, new_version_id)

    async def get_version_files(self, version_id: str) -> dict[str, schemas.VersionFile]:
        result = await self.db_session.execute(
            select(
                VersionFile.hash,
                VersionFile.filename,
                VersionFile.type,
                VersionFile.from_adr,
                VersionFile.resource_url,
            ).where(VersionFile.version == version_id)
        )
        return {
            row.type: schemas.VersionFile(
                hash=row.hash, filename=row.filename, from_adr=row.from_adr, resource_url=row.resource_url
            )
            for row in result
        }

    async def set_files_for_version(self, version_id: str, files: Mapping[str, schemas.VersionFile | None]) -> None:
        """Replaces the version's files. Runs in the request's transaction, so it all happens or none of it does."""
        await self.db_session.execute(delete(VersionFile).where(VersionFile.version == version_id))
        rows = [
            {
                "version": version_id,
                "type": file_type,
                "hash": file.hash,
                "filename": file.filename,
                "from_adr": file.from_adr,
                "resource_url": file.resource_url,
            }
            for file_type, file in files.items()
            if file is not None
        ]
        if rows:
            await self.db_session.execute(insert(VersionFile), rows)

    async def _insert_with_parent_state(
        self, parent_version_id: str, new_version_id: str, project_id: int, note: str | None, version_number: int
    ) -> None:
        parent_state = select(ProjectVersion.state).where(ProjectVersion.id == parent_version_id).scalar_subquery()
        await self.db_session.execute(
            insert(ProjectVersion).values(
                id=new_version_id, note=note, project_id=project_id, version_number=version_number, state=parent_state
            )
        )

    async def _copy_files(self, parent_version_id: str, new_version_id: str) -> None:
        await self.set_files_for_version(new_version_id, await self.get_version_files(parent_version_id))

    async def _check_version_exists(self, version_id: str, project_id: int, user_id: str) -> None:
        result = await self.db_session.execute(
            select(ProjectVersion.id)
            .join(Project, ProjectVersion.project_id == Project.id)
            .where(ProjectVersion.id == version_id, Project.id == project_id, Project.user_id == user_id)
        )
        if result.one_or_none() is None:
            raise VersionDoesNotExistError

    async def _next_version_number(self, project_id: int | None) -> int:
        highest = await self.db_session.scalar(
            select(func.max(ProjectVersion.version_number)).where(ProjectVersion.project_id == project_id)
        )
        return (highest or 0) + 1


def get_version_repository(db_session: DbSession) -> VersionRepository:
    return VersionRepository(db_session)
