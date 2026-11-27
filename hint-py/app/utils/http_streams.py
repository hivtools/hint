"""Sending the body of a request without blocking the event loop.

httpx builds a multipart body that has a file in it as a sync stream: as it is sent, the stream calls the file's blocking
`read()`. An `AsyncClient` would make those reads on the event loop, and every other request that this API is serving
would wait while a large file is read. A file can be some hundreds of MB, and it is on the uploads share, which is a
network mount in production. So `read_in_thread` makes the request read each piece of its body in a thread.
"""

import asyncio
from collections.abc import AsyncIterator, Iterator
from typing import cast

import httpx2


class _ReadInThread(httpx2.AsyncByteStream):
    """A body that gets each of its pieces from a sync stream, in a thread."""

    def __init__(self, body: Iterator[bytes]):
        self._body = body

    async def __aiter__(self) -> AsyncIterator[bytes]:
        while (piece := await asyncio.to_thread(next_piece, self._body)) is not None:
            yield piece


def next_piece(body: Iterator[bytes]) -> bytes | None:
    """The next piece of the body, or None at its end. It blocks, so it is called in a thread."""
    return next(body, None)


def read_in_thread(request: httpx2.Request) -> None:
    """Makes the request read its body in a thread as it is sent. The body must be a sync stream, as the body that httpx
    builds from a file is. The pieces are the same, so the headers (such as `Content-Length`) stay right."""
    request.stream = _ReadInThread(iter(cast(httpx2.SyncByteStream, request.stream)))
