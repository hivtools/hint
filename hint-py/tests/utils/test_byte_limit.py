import pytest

from app.utils.byte_limit import MB, TooMuchData, within_limit, within_limit_async


async def async_pieces(*pieces: bytes, seen: list[bytes] | None = None):
    for piece in pieces:
        if seen is not None:
            seen.append(piece)
        yield piece


def test_a_mb_is_1024_times_1024_bytes():
    assert MB == 1024 * 1024


def test_the_pieces_are_the_same_if_they_are_within_the_limit():
    assert list(within_limit([b"12345", b"67890"], 10)) == [b"12345", b"67890"]


def test_no_pieces_are_within_any_limit():
    assert list(within_limit([], 0)) == []


def test_a_limit_of_nothing_lets_in_empty_pieces_only():
    assert list(within_limit([b"", b""], 0)) == [b"", b""]
    with pytest.raises(TooMuchData):
        list(within_limit([b"x"], 0))


def test_the_first_piece_past_the_limit_is_an_error_and_the_pieces_after_it_are_not_taken():
    taken = []

    def pieces():
        for piece in (b"12345", b"67890", b"x", b"never"):
            taken.append(piece)
            yield piece

    given = []
    with pytest.raises(TooMuchData):
        for piece in within_limit(pieces(), 10):
            given.append(piece)

    assert given == [b"12345", b"67890"]
    assert taken == [b"12345", b"67890", b"x"]


async def test_the_pieces_that_arrive_are_the_same_if_they_are_within_the_limit():
    assert [p async for p in within_limit_async(async_pieces(b"12345", b"67890"), 10)] == [b"12345", b"67890"]


async def test_the_first_piece_that_arrives_past_the_limit_is_an_error_and_no_more_are_awaited():
    taken: list[bytes] = []
    given = []

    with pytest.raises(TooMuchData):
        async for piece in within_limit_async(async_pieces(b"12345", b"67890", b"x", b"never", seen=taken), 10):
            given.append(piece)

    assert given == [b"12345", b"67890"]
    assert taken == [b"12345", b"67890", b"x"]
