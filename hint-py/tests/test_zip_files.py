import io
import json
import os
import struct
import zipfile

import pytest

from app.byte_limit import MB
from app.zip_files import MAX_DIRECTORY_BYTES, UnreadableZipError, read_entries
from tests.support import make_zip

ENTRY = "info/state.json"
CONTENT = json.dumps({"a": 1})


def read(content: bytes, **max_bytes: int) -> dict[str, bytes | None]:
    return read_entries(io.BytesIO(content), max_bytes or {ENTRY: MB})


def refused(content: bytes, **max_bytes: int) -> str:
    with pytest.raises(UnreadableZipError) as raised:
        read(content, **max_bytes)
    return raised.value.reason


# ---- Reading entries


def test_an_entry_is_read_by_its_exact_name():
    content = make_zip({ENTRY: CONTENT, "other": "x"})

    assert read_entries(io.BytesIO(content), {ENTRY: 100, "other": 100}) == {ENTRY: CONTENT.encode(), "other": b"x"}


def test_a_zip_with_no_entries_has_none_of_them():
    assert read(b"PK\x05\x06" + b"\x00" * 18) == {ENTRY: None}


def test_an_entry_that_the_zip_does_not_have_is_none():
    content = make_zip(
        {"info/other.json": "x", "nested/info/state.json": "x", "Info/State.json": "x", ENTRY + ".bak": "x"}
    )

    assert read(content) == {ENTRY: None}


def test_an_entry_that_is_empty_is_empty_and_not_none():
    assert read(make_zip({ENTRY: ""})) == {ENTRY: b""}


def test_no_names_asked_for_is_no_entries_read():
    assert read_entries(io.BytesIO(make_zip({ENTRY: CONTENT})), {}) == {}


@pytest.mark.parametrize("method", [zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED, zipfile.ZIP_BZIP2, zipfile.ZIP_LZMA])
def test_each_way_of_compressing_is_read(method):
    assert read(make_zip({ENTRY: CONTENT}, method)) == {ENTRY: CONTENT.encode()}


def test_a_zip_with_a_comment_is_read():
    """The end of the zip is then not where it is usually, and Python looks for it."""
    assert read(make_zip({ENTRY: CONTENT}, comment=b"a comment " * 1000)) == {ENTRY: CONTENT.encode()}


def test_the_entries_that_are_not_asked_for_are_not_read():
    content = make_zip({ENTRY: CONTENT, "big": os.urandom(100_000)}, zipfile.ZIP_STORED)
    source = io.BytesIO(content)
    reads = []
    original = source.read
    source.read = lambda size=-1: reads.append(size) or original(size)  # ty: ignore[invalid-assignment]

    read_entries(source, {ENTRY: MB})

    assert sum(size for size in reads) < 10_000


def test_the_source_is_read_from_wherever_its_position_is():
    """`zipfile` goes to the end of the file by itself, so a source that has just been written needs no `seek(0)`."""
    source = io.BytesIO()
    source.write(make_zip({ENTRY: CONTENT}))

    assert source.tell() > 0
    assert read_entries(source, {ENTRY: MB}) == {ENTRY: CONTENT.encode()}


def test_a_file_on_the_disk_is_read(tmp_path):
    path = tmp_path / "a.zip"
    path.write_bytes(make_zip({ENTRY: CONTENT, "big": os.urandom(3 * MB)}))

    with path.open("rb") as source:
        assert read_entries(source, {ENTRY: MB}) == {ENTRY: CONTENT.encode()}


# ---- A zip that cannot be read


@pytest.mark.parametrize(
    ("content", "reason"),
    [
        (b"this is not a zip", "zipfile.BadZipFile"),
        (b"", "zipfile.BadZipFile"),
    ],
    ids=["not a zip", "empty"],
)
def test_a_file_that_is_not_a_zip_has_the_reason_in_its_error(content, reason):
    assert refused(content) == reason


def test_a_zip_that_is_cut_short_is_refused():
    content = make_zip({ENTRY: CONTENT, "output/results.bin": os.urandom(100_000)})

    assert refused(content[: len(content) // 2]) == "zipfile.BadZipFile"


def test_an_entry_that_is_cut_short_is_refused():
    """The directory of the zip is fine, but the data of the entry is not."""
    content = bytearray(make_zip({ENTRY: CONTENT}, zipfile.ZIP_STORED))
    # The data of a stored entry follows its header (30 bytes and its name). Break the data, so that the checksum is wrong.
    start = 30 + len(ENTRY)
    content[start : start + 5] = b"XXXXX"

    assert refused(bytes(content)) == "zipfile.BadZipFile"


def test_an_entry_that_is_compressed_wrongly_is_refused():
    content = bytearray(make_zip({ENTRY: CONTENT}))
    start = 30 + len(ENTRY)
    content[start : start + 6] = b"\xff\xff\xff\xff\xff\xff"

    assert refused(bytes(content)) == "zlib.error"


def test_an_entry_that_is_encrypted_is_refused():
    content = bytearray(make_zip({ENTRY: CONTENT}, zipfile.ZIP_STORED))
    # Bit 0 of the flags says that the entry is encrypted. It is at offset 6 of the header of the entry and offset 8 of its
    # record in the directory.
    for signature, offset in ((b"PK\x03\x04", 6), (b"PK\x01\x02", 8)):
        content[content.index(signature) + offset] |= 1

    assert refused(bytes(content)) == "builtins.RuntimeError"


def test_an_entry_that_has_a_way_of_compressing_that_is_not_known_is_refused():
    content = bytearray(make_zip({ENTRY: CONTENT}, zipfile.ZIP_STORED))
    # The method is at offset 8 of the header of the entry and offset 10 of its record in the directory
    for signature, offset in ((b"PK\x03\x04", 8), (b"PK\x01\x02", 10)):
        content[content.index(signature) + offset : content.index(signature) + offset + 2] = struct.pack("<H", 99)

    assert refused(bytes(content)) == "builtins.NotImplementedError"


# ---- A zip that is made to use a lot of memory


def test_an_entry_that_is_past_its_limit_is_refused_and_a_small_one_is_not_affected_by_it():
    content = make_zip({ENTRY: "x" * 101, "small": "x" * 100})

    assert refused(content, **{ENTRY: 100}) == "too big"
    assert read_entries(io.BytesIO(content), {"small": 100}) == {"small": b"x" * 100}


def test_each_entry_has_its_own_limit():
    content = make_zip({"a": "x" * 50, "b": "x" * 500})

    assert read_entries(io.BytesIO(content), {"a": 50, "b": 500}) == {"a": b"x" * 50, "b": b"x" * 500}
    assert refused(content, a=500, b=499) == "too big"
    assert refused(content, a=49, b=500) == "too big"


def test_an_entry_at_its_limit_is_read():
    assert read(make_zip({ENTRY: "x" * 100}), **{ENTRY: 100}) == {ENTRY: b"x" * 100}


def test_an_entry_that_expands_a_lot_is_refused_and_not_read_whole():
    """30 MB of spaces is 30 KB in the zip. Only the limit and a piece of it are read."""
    content = make_zip({ENTRY: " " * (30 * MB)})
    assert len(content) < 100_000

    assert refused(content, **{ENTRY: 20 * MB}) == "too big"


def test_an_entry_that_says_that_it_is_small_but_is_large_is_refused():
    """The size that a zip says for an entry is wrong, so it is not what stops the read (the limit is). It is refused
    either way: the zip does not read more than the entry says, and then its checksum is wrong."""
    content = bytearray(make_zip({ENTRY: " " * 5000 + "{}"}, zipfile.ZIP_STORED))
    # The size of the entry, in the header of the entry (offset 22, which has the size that follows the compressed size)
    # and in its record in the directory (offset 24). It says 10 bytes, and the zip has 5,002.
    for signature, offset in ((b"PK\x03\x04", 22), (b"PK\x01\x02", 24)):
        at = content.index(signature) + offset
        content[at : at + 4] = struct.pack("<I", 10)

    assert refused(bytes(content), **{ENTRY: 10 * MB}) == "zipfile.BadZipFile"


def test_a_zip_with_more_entries_than_the_limit_of_its_directory_is_refused(monkeypatch):
    monkeypatch.setattr("app.zip_files.MAX_DIRECTORY_BYTES", 1000)
    # Each entry takes 46 bytes of the directory and its name
    content = make_zip({ENTRY: CONTENT, **{f"entry-{i}": "" for i in range(30)}})

    assert refused(content) == "too big"


def test_a_zip_with_many_entries_is_read_if_its_directory_is_within_the_limit():
    content = make_zip({ENTRY: CONTENT, **{f"entry-{i:04d}": "" for i in range(2000)}})

    assert read(content) == {ENTRY: CONTENT.encode()}


def test_the_limit_of_the_directory_is_1_mb():
    assert MAX_DIRECTORY_BYTES == MB


def test_the_directory_of_a_zip_with_too_many_entries_is_refused_with_the_limit_of_the_code():
    """Each entry takes 46 bytes of the directory, and its name. This one has 1.5 MB of directory."""
    content = make_zip({ENTRY: CONTENT, **{f"entries/entry-{i:06d}": "" for i in range(25_000)}})
    assert len(content) > MB

    assert refused(content) == "too big"
