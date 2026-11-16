"""The files of the version a request works on: what hintr is told about them, and the uploading, removing and setting of them."""

from collections.abc import Mapping
from typing import Annotated, BinaryIO

from fastapi import Depends

from app import schemas
from app.config import Settings, get_settings
from app.db.version_repository import VersionRepository, get_version_repository
from app.dependencies import current_version_id
from app.schemas import FileType
from app.services.upload_storage import UploadStorage


class VersionFiles:
    """Works on the files of the version in the request, which `current_version_id` has already checked the user may use."""

    def __init__(self, version_id: str, versions: VersionRepository, upload_dir: str, storage: UploadStorage):
        self._version_id = version_id
        self._versions = versions
        self._upload_dir = upload_dir
        self._storage = storage

    def _for_hintr(self, file: schemas.VersionFile) -> schemas.HintrFile:
        return schemas.HintrFile(
            path=f"{self._upload_dir}/{file.hash}",
            hash=file.hash,
            filename=file.filename,
            from_adr=file.from_adr,
            resource_url=file.resource_url,
        )

    async def get_files(self, *types: FileType) -> dict[FileType, schemas.HintrFile]:
        """The version's files of these types, by type. A type the version has no file for is left out."""
        files = await self._versions.get_version_files(self._version_id)
        return {file_type: self._for_hintr(file) for file_type, file in files.items() if file_type in types}

    async def get_file(self, file_type: FileType) -> schemas.HintrFile | None:
        return (await self.get_files(file_type)).get(file_type)

    async def save_upload(self, file_type: FileType, content: BinaryIO, filename: str) -> schemas.HintrFile:
        """Makes an uploaded file the version's file of this type, in place of the one it had.

        The file is written before anything is recorded about it, so a failure to write leaves no row that points at a
        file that is not there. The file is not checked here: that is for hintr to do.
        """
        file_hash = await self._storage.save(content, filename)
        await self._versions.save_new_hash(file_hash)
        file = schemas.VersionFile(hash=file_hash, filename=filename, from_adr=False, resource_url=None)
        await self._versions.save_version_file(self._version_id, file_type, file)
        return self._for_hintr(file)

    async def remove(self, file_type: FileType) -> None:
        await self._versions.remove_version_file(self._version_id, file_type)

    async def set_all(self, files: Mapping[FileType, schemas.VersionFile | None]) -> None:
        """Replaces all of the version's files."""
        await self._versions.set_files_for_version(self._version_id, files)


def get_version_files(
    version_id: Annotated[str, Depends(current_version_id)],
    versions: Annotated[VersionRepository, Depends(get_version_repository)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> VersionFiles:
    return VersionFiles(version_id, versions, settings.upload_dir, UploadStorage(settings.upload_dir))


Files = Annotated[VersionFiles, Depends(get_version_files)]
