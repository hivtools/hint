from collections.abc import Collection, Mapping
from typing import NamedTuple

from sqlalchemy import Integer, String, delete, func, insert, literal, select, update
from sqlalchemy.dialects import postgresql, sqlite

from app import schemas
from app.db.database import DbSession
from app.db.models import File, Project, ProjectVersion, VersionFile
from app.errors import LoadFailedError, VersionDoesNotExistError
from app.schemas import FileType


class VersionOwner(NamedTuple):
    project_id: int
    user_id: str


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

    async def get_owner(self, version_id: str) -> VersionOwner | None:
        """The project the version is in, and the user whose project it is. None for a version that does not exist or is
        in no project (a guest's version)."""
        result = await self.db_session.execute(
            select(ProjectVersion.project_id, Project.user_id)
            .join(Project, ProjectVersion.project_id == Project.id)
            .where(ProjectVersion.id == version_id)
        )
        row = result.one_or_none()
        return None if row is None else VersionOwner(project_id=row.project_id, user_id=row.user_id)

    async def get_version_details(self, version_id: str) -> schemas.VersionDetails:
        files = await self.get_version_files(version_id)
        state = await self.db_session.scalar(select(ProjectVersion.state).where(ProjectVersion.id == version_id))
        # A version that has never had its state saved has no state to return, which is an error (as in Kotlin)
        return schemas.VersionDetails(state=state, files=files)  # ty: ignore[invalid-argument-type]

    async def save_version_state(self, version_id: str, state: str) -> None:
        await self.db_session.execute(update(ProjectVersion).where(ProjectVersion.id == version_id).values(state=state))

    async def update_version_note(self, version_id: str, note: str) -> None:
        await self.db_session.execute(update(ProjectVersion).where(ProjectVersion.id == version_id).values(note=note))

    async def delete_version(self, version_id: str) -> None:
        """Soft delete."""
        await self.db_session.execute(
            update(ProjectVersion).where(ProjectVersion.id == version_id).values(deleted=True)
        )

    async def copy_version(
        self, parent_version_id: str, new_version_id: str, project_id: int, note: str | None = None
    ) -> None:
        """A new version of the project, with the state and files of the parent version. The parent is not checked
        here (the endpoints check that it is the user's): it can be in another project (promote copies a version into a
        new project this way), or not exist, which gives a version with no state and no files."""
        await self._insert_with_parent_state(
            parent_version_id, new_version_id, project_id, note, await self._next_version_number(project_id)
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

    async def get_version_files(
        self, version_id: str, types: Collection[FileType] | None = None
    ) -> dict[FileType, schemas.VersionFile]:
        """Returns the files of the version by file type, only for these file types if `types` is given."""
        query = select(
            VersionFile.hash,
            VersionFile.filename,
            VersionFile.type,
            VersionFile.from_adr,
            VersionFile.resource_url,
        ).where(VersionFile.version == version_id)
        if types is not None:
            query = query.where(VersionFile.type.in_(types))
        result = await self.db_session.execute(query)
        return {
            FileType(row.type): schemas.VersionFile(
                hash=row.hash, filename=row.filename, from_adr=row.from_adr, resource_url=row.resource_url
            )
            for row in result
        }

    async def save_new_hash(self, file_hash: str) -> None:
        """Records that a file with this hash exists. Does nothing if the hash is already recorded.

        Two requests can upload the same file at the same time. Both requests reach this point, so the database ignores
        the second insert."""
        # `on_conflict_do_nothing` is only on the insert of the dialect, not on SQLAlchemy's generic `insert`. Production
        # uses Postgres and the tests use SQLite.
        dialect_insert = postgresql.insert if self.db_session.get_bind().dialect.name == "postgresql" else sqlite.insert
        await self.db_session.execute(dialect_insert(File).values(hash=file_hash).on_conflict_do_nothing())

    async def save_version_file(self, version_id: str, file_type: FileType, file: schemas.VersionFile) -> None:
        """Makes this file the version's file for its file type. It replaces the old file.

        This is Kotlin's logic: update the version's row for the file type if there is one, otherwise insert a row. Two
        requests that upload a file type that the version has no file for yet, at the same time, can both insert.
        Kotlin has the same problem. The fix is a unique constraint on `(version, type)` and one `insert ... on conflict
        do update`, but Kotlin shares this database, so it waits until Kotlin is gone (porting checklist, "Deferred")."""
        values = {
            "hash": file.hash,
            "filename": file.filename,
            "from_adr": file.from_adr,
            "resource_url": file.resource_url,
        }
        has_file = await self.db_session.scalar(
            select(VersionFile.type).where(VersionFile.version == version_id, VersionFile.type == file_type).limit(1)
        )
        if has_file is None:
            await self.db_session.execute(insert(VersionFile).values(version=version_id, type=file_type, **values))
        else:
            await self.db_session.execute(
                update(VersionFile)
                .where(VersionFile.version == version_id, VersionFile.type == file_type)
                .values(**values)
            )

    async def remove_version_file(self, version_id: str, file_type: FileType) -> None:
        """Removes the file from the version. The file stays on the share, because other versions can use it."""
        await self.db_session.execute(
            delete(VersionFile).where(VersionFile.version == version_id, VersionFile.type == file_type)
        )

    async def set_files_for_version(
        self, version_id: str, files: Mapping[FileType, schemas.VersionFile | None]
    ) -> None:
        """Replaces the version's files. Runs in the request's transaction, so it all happens or none of it does.

        A hash that no upload made is an error (`LoadFailedError`). Without this check, the database raises a foreign key
        error."""
        hashes = {file.hash for file in files.values() if file is not None}
        if hashes:
            known = set(await self.db_session.scalars(select(File.hash).where(File.hash.in_(hashes))))
            if known != hashes:
                raise LoadFailedError
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

    async def _next_version_number(self, project_id: int | None) -> int:
        highest = await self.db_session.scalar(
            select(func.max(ProjectVersion.version_number)).where(ProjectVersion.project_id == project_id)
        )
        return (highest or 0) + 1


def get_version_repository(db_session: DbSession) -> VersionRepository:
    return VersionRepository(db_session)
