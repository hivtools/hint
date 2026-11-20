"""Importing an input file from ADR into the version in a request.

An import is the same as an upload of the file, but the file comes from ADR: the same checks, the same storage, the same
validation by hintr (see `InputFileService`). This module only adds what is different:

- The download goes to ADR's own address, as the user, whatever host the link has (see `AdrClient.file_at`).
- The name of the file is the last part of the link, and its extension is checked before anything is downloaded.
- The size limit of the file type applies to the download. The download stops when it passes the limit.
- The version records that the file came from ADR, with its link at the newest activity of its dataset.

If the link is not on ADR, or there is no credential for ADR, the error is raised. If the download fails, the failure is
the answer. Either way nothing changes. If the extension is refused, the version's file of that type is taken off, as for
an upload.
"""

from app.clients.adr_client import AdrClient
from app.clients.responses import HintResponse
from app.schemas import AdrResource, FileType
from app.services.input_file_service import INPUT_FILE_TYPES, InputFileService


async def import_input_file(
    file_type: FileType,
    resource: AdrResource,
    adr: AdrClient,
    input_files: InputFileService,
) -> HintResponse:
    """Makes the file on ADR the version's file of this type, in place of the old one, and asks hintr to validate it."""
    file = adr.file_at(resource.url)
    refused = await input_files.refuse_wrong_extension(file_type, file.filename)
    if refused is not None:
        return refused
    async with adr.spooled_download(file, INPUT_FILE_TYPES[file_type].max_upload_bytes) as (downloaded, content):
        if not downloaded.ok:
            return downloaded
        # The storage hashes the file from the position it is given
        content.seek(0)
        resource_url = await adr.resource_url(resource.dataset_id, resource.resource_id, file.filename)
        return await input_files.save(file_type, content, file.filename, resource_url=resource_url)
