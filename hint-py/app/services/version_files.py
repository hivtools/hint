"""The files of the version in a request, as the database records them. This module tells hintr where the files are. It
also records, removes and sets them. A new input file comes in through `app/services/input_file_service.py`."""

from collections.abc import Mapping
from typing import Annotated

from fastapi import Depends

from app import schemas
from app.config import Settings, get_settings
from app.db.version_repository import VersionRepository, get_version_repository
from app.dependencies import current_version_id
from app.schemas import FileType


class VersionFiles:
    """Works on the files of the version in the request. `current_version_id` has already checked that the user can use
    the version."""

    def __init__(self, version_id: str, versions: VersionRepository, upload_dir: str):
        self._version_id = version_id
        self._versions = versions
        self._upload_dir = upload_dir

    def _for_hintr(self, file: schemas.VersionFile) -> schemas.HintrFile:
        return schemas.HintrFile(
            path=f"{self._upload_dir}/{file.hash}",
            hash=file.hash,
            filename=file.filename,
            from_adr=file.from_adr,
            resource_url=file.resource_url,
        )

    async def get_files(self, *types: FileType) -> dict[FileType, schemas.HintrFile]:
        """Returns the files of the version for these file types, by file type. A file type with no file is not in the
        result."""
        files = await self._versions.get_version_files(self._version_id, types)
        return {file_type: self._for_hintr(file) for file_type, file in files.items()}

    async def get_file(self, file_type: FileType) -> schemas.HintrFile | None:
        return (await self.get_files(file_type)).get(file_type)

    async def record(self, file_type: FileType, file: schemas.VersionFile) -> schemas.HintrFile:
        """Makes a stored file the version's file for this file type. It replaces the old file.

        The file must be on the share already, so that no database row points at a missing file."""
        await self._versions.save_new_hash(file.hash)
        await self._versions.save_version_file(self._version_id, file_type, file)
        return self._for_hintr(file)

    async def remove(self, file_type: FileType) -> None:
        await self._versions.remove_version_file(self._version_id, file_type)

    async def set_all(self, files: Mapping[FileType, schemas.VersionFile | None]) -> None:
        """Replaces all the files of the version."""
        await self._versions.set_files_for_version(self._version_id, files)


def get_version_files(
    version_id: Annotated[str, Depends(current_version_id)],
    versions: Annotated[VersionRepository, Depends(get_version_repository)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> VersionFiles:
    return VersionFiles(version_id, versions, settings.upload_dir)


Files = Annotated[VersionFiles, Depends(get_version_files)]
