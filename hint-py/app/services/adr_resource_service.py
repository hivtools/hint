"""Putting the files of a project on ADR, as resources of a dataset. (A release of a dataset is in
`app/services/adr_release_service.py`.)

This module has the rules. It asks ADR through the client in `app/clients/adr_client.py`, which knows how ADR is asked.

The user pushes one of these:

- An output of the model (the output zip, the summary report or the comparison report). It is the file of a finished
  download, which hintr wrote to the results folder. It is sent from there, and is not copied.
- An input file of the version (PJNZ, shape, population, survey, programme or ANC). It is sent from the uploads folder, and
  is not copied. ADR gets it under the name that the user uploaded it with.

Which of the two it is comes from the resource type, which is the type that ADR gives to the resource (see
`app/services/file_types.py`). With no resource id the file becomes a new resource. With one, the file replaces the
resource, but only if ADR has a different file there: ADR says what its file's hash is, and a file with the same hash is
not sent again.

Nothing is copied or written, so there is nothing to clean up. The file is read in pieces, so a large file is not in
memory.
"""

import asyncio
from dataclasses import dataclass
from pathlib import Path
from typing import Annotated

import structlog
from fastapi import Depends

from app.clients.adr_client import Adr, AdrClient, ResourceUpload
from app.clients.responses import HintResponse
from app.errors import (
    AdrHashUnavailableError,
    DescriptionRequiredError,
    FileDoesNotExistError,
    InvalidResourceTypeError,
    MissingUploadFileError,
    ResourceIdRequiredError,
)
from app.schemas import FileType
from app.services.file_types import input_file_type_on_adr, is_output_on_adr
from app.services.task_results import Results, TaskResults
from app.services.version_files import Files, VersionFiles
from app.storage.uploads import md5_of_file

log = structlog.get_logger()


@dataclass(frozen=True)
class FileToPush:
    """What the user asked to push: the details of the request."""

    dataset_id: str
    # The type that ADR gives to the resource. It says which kind of file this is.
    resource_type: str
    # An output is the file of this download. An input file does not use it.
    download_id: str
    # The name that ADR gives an output. An input file keeps the name that it was uploaded with.
    file_name: str
    resource_name: str
    # The resource that the file replaces. None if the file is a new resource.
    resource_id: str | None
    # Only an output has one, and it must
    description: str | None


@dataclass(frozen=True)
class _FileToSend:
    """The file on the disk that is sent, and what ADR is told of it."""

    path: Path
    # The name that ADR gives the file
    filename: str
    # Only an output has one
    description: str | None


class AdrResourceService:
    """Puts the files of a project on ADR, as the user."""

    def __init__(self, adr: AdrClient, results: TaskResults, files: VersionFiles):
        self._adr = adr
        self._results = results
        self._files = files

    async def push(self, push: FileToPush) -> HintResponse:
        """Puts the file on ADR as a resource of the dataset, or replaces the resource that ADR has.

        Raises an error for a request that cannot be done (see `app/errors.py`): a resource type that is not known, no
        description for an output, no resource id for an input file, an input file that the version does not have, no
        credential for ADR, or no way to get the hash of the resource. If hintr cannot give the output, hintr's failure
        is raised (`HintrFailedError`). If ADR fails, or does not answer, the answer is the failure.

        A resource that ADR has already with the same file (the same hash) is a success that sends nothing.
        """
        input_type = input_file_type_on_adr(push.resource_type)
        if is_output_on_adr(push.resource_type):
            file = await self._output(push)
        elif input_type is not None:
            file = await self._input(push, input_type.file_type)
        else:
            raise InvalidResourceTypeError

        upload = ResourceUpload(
            path=file.path,
            filename=file.filename,
            name=push.resource_name,
            hash=await asyncio.to_thread(md5_of_file, file.path),
            resource_type=push.resource_type,
            description=file.description,
        )
        if push.resource_id is None:
            return await self._adr.create_resource(push.dataset_id, upload)
        stored = await self._adr.resource_hash(push.resource_id)
        if not stored.ok:
            raise AdrHashUnavailableError
        if stored.data == upload.hash:
            return HintResponse.success(True)
        return await self._adr.update_resource(push.resource_id, upload)

    async def _output(self, push: FileToPush) -> _FileToSend:
        """The file of the download, and the name and description that ADR gets for it."""
        if push.description is None:
            raise DescriptionRequiredError
        download = await self._results.download_file(push.download_id)
        return _FileToSend(download.path, push.file_name, push.description)

    async def _input(self, push: FileToPush, file_type: FileType) -> _FileToSend:
        """The version's file of this type, and the name that it was uploaded with. An input file has no description."""
        if push.resource_id is None:
            raise ResourceIdRequiredError
        file = await self._files.get_file(file_type)
        if file is None:
            raise FileDoesNotExistError
        path = Path(file.path)
        if not path.is_file():
            # The database has the file, and the uploads folder does not. This is not for the user to act on.
            log.error("File of the version missing from the uploads folder", path=str(path), file_type=file_type.value)
            raise MissingUploadFileError(str(path))
        return _FileToSend(path, file.filename, None)


def get_adr_resource_service(adr: Adr, results: Results, files: Files) -> AdrResourceService:
    return AdrResourceService(adr, results, files)


AdrResources = Annotated[AdrResourceService, Depends(get_adr_resource_service)]
