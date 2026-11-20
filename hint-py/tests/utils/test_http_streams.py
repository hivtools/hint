import io
import threading

import httpx2

from app.utils import http_streams
from app.utils.http_streams import read_in_thread


def request_with_a_file(content: bytes) -> httpx2.Request:
    return httpx2.Request("POST", "https://example/", files={"upload": ("file", io.BytesIO(content))})


async def body_of(request: httpx2.Request) -> bytes:
    assert isinstance(request.stream, httpx2.AsyncByteStream)
    return b"".join([piece async for piece in request.stream])


async def test_the_body_is_the_same_and_so_is_its_length():
    expected = request_with_a_file(b"x" * (300 * 1024))
    request = request_with_a_file(b"x" * (300 * 1024))

    read_in_thread(request)

    body = await body_of(request)
    # The boundary of each multipart body is its own
    assert len(body) == len(expected.read()) == int(request.headers["Content-Length"])


async def test_each_piece_is_read_in_a_thread_and_not_on_the_event_loop(monkeypatch):
    reading_threads = []
    real = http_streams.next_piece

    def next_piece_in_a_thread(body):
        reading_threads.append(threading.get_ident())
        return real(body)

    monkeypatch.setattr(http_streams, "next_piece", next_piece_in_a_thread)
    request = request_with_a_file(b"x" * (300 * 1024))

    read_in_thread(request)
    await body_of(request)

    # Many pieces, and one more call that finds the end
    assert len(reading_threads) > 4
    assert threading.get_ident() not in reading_threads
