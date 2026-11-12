"""The files of the version a request works on, in the form hintr is given them."""

from typing import Annotated

from fastapi import Depends

from app import schemas
from app.config import Settings, get_settings
from app.db.version_repository import VersionRepository, get_version_repository
from app.dependencies import current_version_id
from app.schemas import FileType


class VersionFiles:
    """Looks up the files of the version in the request, which `current_version_id` has already checked the user may use."""

    def __init__(self, version_id: str, versions: VersionRepository, upload_dir: str):
        self._version_id = version_id
        self._versions = versions
        self._upload_dir = upload_dir

    async def get_files(self, *types: FileType) -> dict[FileType, schemas.HintrFile]:
        """The version's files of these types, by type. A type the version has no file for is left out."""
        files = await self._versions.get_version_files(self._version_id)
        return {
            file_type: schemas.HintrFile(
                path=f"{self._upload_dir}/{file.hash}",
                hash=file.hash,
                filename=file.filename,
                from_adr=file.from_adr,
                resource_url=file.resource_url,
            )
            for file_type, file in files.items()
            if file_type in types
        }

    async def get_file(self, file_type: FileType) -> schemas.HintrFile | None:
        return (await self.get_files(file_type)).get(file_type)


def get_version_files(
    version_id: Annotated[str, Depends(current_version_id)],
    versions: Annotated[VersionRepository, Depends(get_version_repository)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> VersionFiles:
    return VersionFiles(version_id, versions, settings.upload_dir)


Files = Annotated[VersionFiles, Depends(get_version_files)]
