"""The files of the version a request works on, in the form hintr is given them."""

from typing import Annotated

from fastapi import Depends

from app import schemas
from app.config import Settings, get_settings
from app.db.version_repository import VersionRepository, get_version_repository
from app.dependencies import User, current_user, requested_version_id, usable_version_id
from app.schemas import FileType


class VersionFiles:
    """Looks up the files of the version in the request.

    The version is only checked (see `usable_version_id`) when a file is asked for. An endpoint that needs files for
    some requests and not for others (a download of one type or another) then only needs a version for the first.
    """

    def __init__(
        self,
        user: User,
        version_id: str | None,
        versions: VersionRepository,
        upload_dir: str,
    ):
        self._user = user
        self._version_id = version_id
        self._versions = versions
        self._upload_dir = upload_dir

    async def get(self, *types: FileType) -> dict[str, schemas.HintrFile]:
        """The version's files of these types, by type. A type the version has no file for is left out."""
        version_id = await usable_version_id(self._user, self._version_id, self._versions)
        files = await self._versions.get_version_files(version_id)
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

    async def get_one(self, file_type: FileType) -> schemas.HintrFile | None:
        return (await self.get(file_type)).get(file_type)


def get_version_files(
    user: Annotated[User, Depends(current_user)],
    version_id: Annotated[str | None, Depends(requested_version_id)],
    versions: Annotated[VersionRepository, Depends(get_version_repository)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> VersionFiles:
    return VersionFiles(user, version_id, versions, settings.upload_dir)


Files = Annotated[VersionFiles, Depends(get_version_files)]
