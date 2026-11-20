"""A limit on how much data is read.

The size of data that comes from outside (a download, a zip entry) is not known before it is read, and a size that the
sender says can be wrong. So the pieces are counted as they arrive, and the read stops at the first piece that takes the
total past the limit. The data that is past the limit is not read.

`within_limit` is for pieces that are read at once (a file). `within_limit_async` is for pieces that come from the
network.
"""

from collections.abc import AsyncIterable, AsyncIterator, Iterable, Iterator

MB = 1024 * 1024


class TooMuchData(Exception):
    """The data is past the limit."""


def within_limit(pieces: Iterable[bytes], max_bytes: int) -> Iterator[bytes]:
    """The same pieces. Raises `TooMuchData` instead of the first piece that takes the total past `max_bytes`."""
    received = 0
    for piece in pieces:
        received += len(piece)
        if received > max_bytes:
            raise TooMuchData
        yield piece


async def within_limit_async(pieces: AsyncIterable[bytes], max_bytes: int) -> AsyncIterator[bytes]:
    """The same as `within_limit`, for pieces that arrive as they are sent."""
    received = 0
    async for piece in pieces:
        received += len(piece)
        if received > max_bytes:
            raise TooMuchData
        yield piece
