"""Writing the files that users upload to the uploads folder (the Azure Files share that hintr reads them from).

A file is named by its content, `<MD5 of the content in upper case>.<extension>`, so uploading the same file again (by
anyone) finds it already there, and the projects that were saved by the Kotlin app find their files.
"""

import asyncio
import hashlib
import os
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


def _store(directory: Path, source: BinaryIO, filename: str) -> str:
    directory.mkdir(parents=True, exist_ok=True)
    md5 = hashlib.md5(usedforsecurity=False)
    # The folder of the file, so that the last step is a rename and a reader never sees half a file
    handle, temporary_name = tempfile.mkstemp(dir=directory, prefix=".upload-")
    temporary = Path(temporary_name)
    try:
        with os.fdopen(handle, "wb") as out:
            while chunk := source.read(CHUNK_SIZE):
                md5.update(chunk)
                out.write(chunk)
        temporary.chmod(READABLE)
        name = f"{md5.hexdigest().upper()}.{file_extension(filename)}"
        target = directory / name
        # The same name is the same content. A file that is not there is written, also if it was once: the row in the
        # database is not proof that the file is on the disk
        if not target.is_file():
            temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)
    return name


class UploadStorage:
    def __init__(self, directory: str):
        self._directory = Path(directory)

    async def save(self, source: BinaryIO, filename: str) -> str:
        """Writes the file, unless it is there already, and returns its name (which is its hash)."""
        if "\x00" in filename:
            raise NullInFileNameError()
        return await asyncio.to_thread(_store, self._directory, source, filename)
