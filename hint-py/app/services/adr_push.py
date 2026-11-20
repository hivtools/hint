"""Putting the work of a user on ADR: a release of a dataset, and the files of a project as resources of a dataset.

This module has the rules. It asks ADR through the client in `app/clients/adr_client.py`, which knows how ADR is asked.

**A release.** ADR keeps releases of a dataset, and every release has a name that is not used by another release of the
dataset. A user who makes a release with the name of an old one means to replace it. So `create_release` first deletes the
old release with that name, then makes the new one.

**A file.** The user pushes one of these:

- An output of the model (the output zip, the summary report or the comparison report). It is the file of a finished
  download, which hintr wrote to the results folder. It is sent from there, and is not copied.
- An input file of the version (PJNZ, shape, population, survey, programme or ANC). It is sent from the uploads folder, and
  is not copied. ADR gets it under the name that the user uploaded it with.

Which of the two it is comes from the resource type, which is the type that ADR gives to the resource (see the settings
`adr_*_schema`). With no resource id the file becomes a new resource. With one, the file replaces the resource, but only if
ADR has a different file there: ADR says what its file's hash is, and a file with the same hash is not sent again.

Nothing is copied or written, so there is nothing to clean up. The file is read in pieces, so a large file is not in
memory.
"""

import asyncio
from dataclasses import dataclass
from pathlib import Path

import structlog

from app.clients.adr_client import AdrClient, ResourceUpload
from app.clients.responses import HintResponse
from app.config import Settings
from app.errors import (
    AdrHashUnavailableError,
    DescriptionRequiredError,
    FileDoesNotExistError,
    InvalidResourceTypeError,
    MissingUploadFileError,
    ResourceIdRequiredError,
)
from app.schemas import FileType
from app.services.task_results import TaskResults
from app.services.version_files import VersionFiles
from app.storage.uploads import md5_of_file

log = structlog.get_logger()


async def create_release(adr: AdrClient, dataset_id: str, name: str) -> HintResponse:
    """Makes a release of the dataset with this name. The answer is ADR's answer to the last call, or the failure of the
    first call that fails.

    **If the dataset has a release with this name, that release is deleted first, and the delete cannot be undone.**
    ADR does not allow two releases with the same name. If the delete works and the new release then fails, the dataset
    has lost the old release and has no new one. The user hears that the release failed, and can try again.
    """
    existing = await adr.releases(dataset_id)
    if not existing.ok:
        return existing
    # The first one, if there are more than one. ADR does not allow it, so there are not.
    same_name = next((release for release in existing.data if release.get("name") == name), None)
    if same_name is not None:
        deleted = await adr.delete_release(str(same_name["id"]))
        if not deleted.ok:
            return deleted
    return await adr.create_release(dataset_id, name)


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


def _input_file_types(settings: Settings) -> dict[str, FileType]:
    return {
        settings.adr_pjnz_schema: FileType.PJNZ,
        settings.adr_shape_schema: FileType.SHAPE,
        settings.adr_pop_schema: FileType.POPULATION,
        settings.adr_survey_schema: FileType.SURVEY,
        settings.adr_art_schema: FileType.PROGRAMME,
        settings.adr_anc_schema: FileType.ANC,
    }


def _output_resource_types(settings: Settings) -> set[str]:
    return {settings.adr_output_zip_schema, settings.adr_output_summary_schema, settings.adr_output_comparison_schema}


async def push_file(
    push: FileToPush, adr: AdrClient, settings: Settings, results: TaskResults, files: VersionFiles
) -> HintResponse:
    """Puts the file on ADR as a resource of the dataset, or replaces the resource that ADR has.

    Raises an error for a request that cannot be done (see `app/errors.py`): a resource type that is not known, no
    description for an output, no resource id for an input file, an input file that the version does not have, no
    credential for ADR, or no way to get the hash of the resource. If hintr cannot give the output, hintr's failure is
    raised (`HintrFailedError`). If ADR fails, or does not answer, the answer is the failure.

    A resource that ADR has already with the same file (the same hash) is a success that sends nothing.
    """
    input_types = _input_file_types(settings)
    if push.resource_type in _output_resource_types(settings):
        path, filename, description = await _output(push, results)
    elif push.resource_type in input_types:
        path, filename, description = await _input(push, files, input_types[push.resource_type])
    else:
        raise InvalidResourceTypeError

    upload = ResourceUpload(
        path=path,
        filename=filename,
        name=push.resource_name,
        hash=await asyncio.to_thread(md5_of_file, path),
        resource_type=push.resource_type,
        description=description,
    )
    if push.resource_id is None:
        return await adr.create_resource(push.dataset_id, upload)
    stored = await adr.resource_hash(push.resource_id)
    if not stored.ok:
        raise AdrHashUnavailableError
    if stored.data == upload.hash:
        return HintResponse.success(True)
    return await adr.update_resource(push.resource_id, upload)


async def _output(push: FileToPush, results: TaskResults) -> tuple[Path, str, str]:
    """The file of the download, and the name and description that ADR gets for it."""
    if push.description is None:
        raise DescriptionRequiredError
    download = await results.download_file(push.download_id)
    return download.path, push.file_name, push.description


async def _input(push: FileToPush, files: VersionFiles, file_type: FileType) -> tuple[Path, str, None]:
    """The version's file of this type, and the name that it was uploaded with. An input file has no description."""
    if push.resource_id is None:
        raise ResourceIdRequiredError
    file = await files.get_file(file_type)
    if file is None:
        raise FileDoesNotExistError
    path = Path(file.path)
    if not path.is_file():
        # The database has the file, and the uploads folder does not. This is not for the user to act on.
        log.error("File of the version missing from the uploads folder", path=str(path), file_type=file_type.value)
        raise MissingUploadFileError(str(path))
    return path, file.filename, None
