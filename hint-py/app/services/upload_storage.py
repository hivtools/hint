"""Writing the files that users upload to the uploads folder (the Azure Files share that hintr reads them from).

A file is named by its content, `<MD5 of the content in upper case>.<extension>`, so uploading the same file again (by
anyone) finds it already there, and the projects that were saved by the Kotlin app find their files.
"""

import asyncio
import hashlib
import os
import shutil
import tempfile
from pathlib import Path
from typing import BinaryIO

from app.errors import NullInFileNameError

CHUNK_SIZE = 1024 * 1024

# The read permissions of a normal file. hintr runs as another user, so a file that only this API can read is no use
READABLE = 0o644


def file_extension(filename: str) -> str:
    """The text after the last dot of the name, which is the whole name if it has no dot (`README` is `HASH.README`:
    names must stay as the Kotlin app made them). Only the last part of a path is looked at, as a name that came
    with directories (`../../a`) must not make a file outside of the folder."""
    name = filename.replace("\\", "/").rsplit("/", 1)[-1]
    return name.rsplit(".", 1)[-1]


def _hash_and_size(source: BinaryIO) -> tuple[str, int]:
    """Reads the whole file once, to hash it, and leaves it ready to be read again from the start."""
    md5 = hashlib.md5(usedforsecurity=False)
    size = 0
    while chunk := source.read(CHUNK_SIZE):
        md5.update(chunk)
        size += len(chunk)
    source.seek(0)
    return md5.hexdigest().upper(), size


def _is_stored(target: Path, size: int) -> bool:
    # The size is checked because the Kotlin app wrote a file where it was named, so one that was cut short (a crash while
    # writing) has the name of a whole one
    return target.is_file() and target.stat().st_size == size


def _store(directory: Path, source: BinaryIO, filename: str) -> str:
    directory.mkdir(parents=True, exist_ok=True)
    # The hash is worked out first, from the upload that this API has already received, so that a file that is stored
    # already is not sent to the share again: the share is slower than the disk, and the time counts against the request
    digest, size = _hash_and_size(source)
    name = f"{digest}.{file_extension(filename)}"
    target = directory / name
    if _is_stored(target, size):
        return name
    # The folder of the file, so that the last step is a rename and a reader never sees half a file
    handle, temporary_name = tempfile.mkstemp(dir=directory, prefix=".upload-")
    temporary = Path(temporary_name)
    try:
        with os.fdopen(handle, "wb") as out:
            shutil.copyfileobj(source, out, CHUNK_SIZE)
        temporary.chmod(READABLE)
        # Another request may have stored the same file while this one was writing: it is the same content
        if not _is_stored(target, size):
            temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)
    return name


class UploadStorage:
    def __init__(self, directory: str):
        self._directory = Path(directory)

    async def save(self, source: BinaryIO, filename: str) -> str:
        """Writes the file, unless it is there already, and returns its name (which is its hash). The source has to be one
        that can be read again from the start (an upload is)."""
        if "\x00" in filename:
            raise NullInFileNameError()
        return await asyncio.to_thread(_store, self._directory, source, filename)
