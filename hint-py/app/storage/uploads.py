"""Writes the uploaded files to the uploads folder. This folder is the Azure Files share, and hintr reads the files from it.

The name of a file is `<MD5 of the content in upper case>.<extension>`. If a user uploads the same file again, the file
is already there. Projects that the Kotlin app saved find their files with the same names.
"""

import asyncio
import hashlib
import os
import shutil
import tempfile
from pathlib import Path
from typing import IO

from app.errors import NullInFileNameError

CHUNK_SIZE = 1024 * 1024

# The owner can read and write the file. All other users can read it. hintr runs as another user, so hintr must be able
# to read the file.
READABLE = 0o644


def file_extension(filename: str) -> str:
    """Returns the text after the last dot of the file name. If the name has no dot, the extension is the whole name.

    For example, `README` becomes `HASH.README`. Files must keep the names that the Kotlin app gave them.
    Only the last part of a path counts. A name with directories (`../../a`) must not make a file outside the folder."""
    name = filename.replace("\\", "/").rsplit("/", 1)[-1]
    return name.rsplit(".", 1)[-1]


def _hash_and_size(source: IO[bytes]) -> tuple[str, int]:
    """Reads the whole file once to hash it. Then goes back to the start of the file, so that it can be read again."""
    md5 = hashlib.md5(usedforsecurity=False)
    size = 0
    while chunk := source.read(CHUNK_SIZE):
        md5.update(chunk)
        size += len(chunk)
    source.seek(0)
    return md5.hexdigest().upper(), size


def _is_stored(target: Path, size: int) -> bool:
    # Check the size also. The Kotlin app wrote a file straight to its final name. If a crash stopped the write, the file
    # has the final name but is too short.
    return target.is_file() and target.stat().st_size == size


def _store(directory: Path, source: IO[bytes], filename: str) -> str:
    directory.mkdir(parents=True, exist_ok=True)
    # Hash the file first. This API has already received the upload, so this step does not use the network. If the file is
    # already on the share, we do not send it again. The share is slower than the local disk, and the write time counts
    # against the request.
    digest, size = _hash_and_size(source)
    name = f"{digest}.{file_extension(filename)}"
    target = directory / name
    if _is_stored(target, size):
        return name
    # Write to a temporary file in the same folder. The last step is then a rename, so no reader sees half a file.
    handle, temporary_name = tempfile.mkstemp(dir=directory, prefix=".upload-")
    temporary = Path(temporary_name)
    try:
        with os.fdopen(handle, "wb") as out:
            shutil.copyfileobj(source, out, CHUNK_SIZE)
        temporary.chmod(READABLE)
        # Another request can store the same file while this request writes. The content is the same, so keep that file.
        if not _is_stored(target, size):
            temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)
    return name


class UploadStorage:
    def __init__(self, directory: str):
        self._directory = Path(directory)

    async def save(self, source: IO[bytes], filename: str) -> str:
        """Writes the file, unless it is already there. Returns the name of the file, which contains its hash.

        The source must support `seek`, so that it can be read again from the start. An upload does."""
        # The name comes from the user, and the extension of the name is part of the stored name. A null character is not
        # allowed in a file name on Linux, and Python raises `ValueError` ("embedded null byte") for a path with one.
        # Postgres also refuses it in text. Either way the request would end as a 500, so refuse it here with a 400.
        if "\x00" in filename:
            raise NullInFileNameError()
        return await asyncio.to_thread(_store, self._directory, source, filename)
