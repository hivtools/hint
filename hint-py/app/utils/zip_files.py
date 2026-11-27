"""Reading some entries of a zip that cannot be trusted.

A zip can be made to use a lot of memory when it is read: an entry can say that it is small and hold a very large one (a
zip bomb), and the list of the entries can have millions of them. So:

- Each entry that is asked for has its own limit, in bytes. It is read in pieces, and the read stops at the first piece
  past the limit. The size that the zip says for an entry is not used, because it can be wrong.
- The list of the entries (the central directory) has a limit too.

Only the entries that are asked for are read. Nothing is extracted. The source must support `seek`, because the zip format
needs reads at many places. It can be a file on the disk, so a large zip is not in memory.
"""

import io
import zipfile
import zlib
from collections.abc import Mapping
from typing import IO

from app.utils.byte_limit import MB, TooMuchData, within_limit

# The most that the list of the entries may be. A zip of some tens of entries has some KB of list. Each entry takes at
# least 46 bytes of it.
MAX_DIRECTORY_BYTES = 1 * MB
# The reason that is given when a size limit is passed
TOO_BIG = "too big"
# The size of the reads of an entry
READ_BYTES = 64 * 1024


class UnreadableZipError(Exception):
    """The source is not a zip that can be read, or it is too big to read. `reason` is short, and is for the log: `TOO_BIG`,
    or the name of the error that Python raised (for example `zipfile.BadZipFile`)."""

    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


class _ZipTooBigError(Exception):
    """The list of entries is bigger than `MAX_DIRECTORY_BYTES`."""


class _SmallReads(io.BufferedIOBase):
    """A file that refuses a big read.

    `zipfile` reads the whole list of the entries of a zip (the central directory) with one read, and the zip says how big
    that is. A zip with millions of small entries would then fill the memory: Python makes an object for each entry. The
    reads of the content of an entry are small, as `_read_entry` reads it in pieces.
    """

    def __init__(self, source: IO[bytes]):
        self._source = source

    def seekable(self) -> bool:
        return True

    def tell(self) -> int:
        return self._source.tell()

    def seek(self, offset: int, whence: int = io.SEEK_SET) -> int:
        return self._source.seek(offset, whence)

    def read(self, size: int | None = -1) -> bytes:
        # `zipfile` always says how much it reads. A read with no size would read to the end of a file that can be large.
        if size is None or size < 0 or size > MAX_DIRECTORY_BYTES:
            raise _ZipTooBigError
        return self._source.read(size)


def _read_entry(archive: zipfile.ZipFile, name: str, max_bytes: int) -> bytes | None:
    """The content of the entry, or None if the zip has no entry with this name."""
    try:
        entry = archive.open(name)
    except KeyError:
        return None
    with entry:
        return b"".join(within_limit(iter(lambda: entry.read(READ_BYTES), b""), max_bytes))


def read_entries(source: IO[bytes], max_bytes: Mapping[str, int]) -> dict[str, bytes | None]:
    """The content of each entry that `max_bytes` names (the name of the entry, and the most that is read of it), or None
    for an entry that the zip does not have. The names are exact.

    Raises `UnreadableZipError` if the source is not a zip, if it is cut short or damaged, if an entry is encrypted or
    compressed in a way that Python does not read, or if an entry or the list of the entries is too big.
    """
    try:
        with zipfile.ZipFile(_SmallReads(source)) as archive:
            return {name: _read_entry(archive, name, limit) for name, limit in max_bytes.items()}
    except _ZipTooBigError, TooMuchData:
        raise UnreadableZipError(TOO_BIG) from None
    # A file that is not a zip, or is cut short, has a wrong checksum, or has an entry that is encrypted or compressed in
    # a way that Python does not read
    except (zipfile.BadZipFile, NotImplementedError, RuntimeError, zlib.error, EOFError) as e:
        raise UnreadableZipError(f"{type(e).__module__}.{type(e).__name__}") from None
