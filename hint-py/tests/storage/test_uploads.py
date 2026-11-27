import hashlib
import io
import sys

import pytest

from app.errors import NullInFileNameError
from app.storage.uploads import UploadStorage, file_extension, md5_of_file


@pytest.mark.parametrize(
    ("filename", "extension"),
    [
        ("Malawi2024.PJNZ", "PJNZ"),
        ("survey.csv", "csv"),
        ("archive.tar.gz", "gz"),
        ("UPPER.CSV", "CSV"),
        # A name with no dot is its own extension. Files must keep the names that the Kotlin app gave them.
        ("README", "README"),
        ("trailing.", ""),
        (".PJNZ", "PJNZ"),
        # A path is not a file name. Only the last part counts.
        ("../../etc/passwd", "passwd"),
        ("..\\..\\a.csv", "csv"),
        ("some/folder/data.csv", "csv"),
        ("some/folder.d/README", "README"),
    ],
)
def test_the_extension_is_the_text_after_the_last_dot_of_the_last_part_of_the_name(filename, extension):
    assert file_extension(filename) == extension


async def test_a_file_is_named_by_the_md5_of_its_content_in_upper_case_and_its_extension(tmp_path):
    name = await UploadStorage(str(tmp_path)).save(io.BytesIO(b"abc"), "data.csv")
    assert name == "900150983CD24FB0D6963F7D28E17F72.csv"
    assert (tmp_path / name).read_bytes() == b"abc"


async def test_a_file_that_is_bigger_than_a_chunk_is_all_written(tmp_path):
    content = bytes(range(256)) * 20_000  # 5 MB
    name = await UploadStorage(str(tmp_path)).save(io.BytesIO(content), "big.bin")
    assert name == f"{hashlib.md5(content, usedforsecurity=False).hexdigest().upper()}.bin"
    assert (tmp_path / name).read_bytes() == content


async def test_the_folder_is_made_if_it_is_not_there(tmp_path):
    folder = tmp_path / "not" / "there" / "yet"
    name = await UploadStorage(str(folder)).save(io.BytesIO(b"abc"), "a.csv")
    assert (folder / name).is_file()


async def test_nothing_is_left_in_the_folder_but_the_file(tmp_path):
    storage = UploadStorage(str(tmp_path))
    name = await storage.save(io.BytesIO(b"abc"), "a.csv")
    await storage.save(io.BytesIO(b"abc"), "b.csv")  # the same content, so the same name
    assert [p.name for p in tmp_path.iterdir()] == [name]


class Counting(io.BytesIO):
    """Counts the bytes that are read from it."""

    bytes_read = 0

    def read(self, size: int | None = -1) -> bytes:
        chunk = super().read(size)
        self.bytes_read += len(chunk)
        return chunk


async def test_a_file_that_is_there_is_not_written_again(tmp_path):
    storage = UploadStorage(str(tmp_path))
    name = await storage.save(io.BytesIO(b"abc"), "a.csv")
    before = (tmp_path / name).stat().st_mtime_ns
    await storage.save(io.BytesIO(b"abc"), "a.csv")
    assert (tmp_path / name).stat().st_mtime_ns == before


async def test_a_file_that_is_there_is_only_read_to_hash_it_and_not_copied(tmp_path):
    storage = UploadStorage(str(tmp_path))
    first, second = Counting(b"abc" * 1000), Counting(b"abc" * 1000)
    await storage.save(first, "a.csv")
    await storage.save(second, "a.csv")
    assert first.bytes_read == 6000  # once to hash it, and once to write it
    assert second.bytes_read == 3000  # once to hash it


async def test_a_file_that_was_cut_short_is_written_again(tmp_path):
    storage = UploadStorage(str(tmp_path))
    name = await storage.save(io.BytesIO(b"abcdef"), "a.csv")
    (tmp_path / name).write_bytes(b"abc")
    await storage.save(io.BytesIO(b"abcdef"), "a.csv")
    assert (tmp_path / name).read_bytes() == b"abcdef"
    assert [p.name for p in tmp_path.iterdir()] == [name]


async def test_a_file_that_has_gone_is_written_again(tmp_path):
    storage = UploadStorage(str(tmp_path))
    name = await storage.save(io.BytesIO(b"abc"), "a.csv")
    (tmp_path / name).unlink()
    await storage.save(io.BytesIO(b"abc"), "a.csv")
    assert (tmp_path / name).read_bytes() == b"abc"


async def test_the_same_content_with_another_extension_is_another_file(tmp_path):
    storage = UploadStorage(str(tmp_path))
    first = await storage.save(io.BytesIO(b"abc"), "a.PJNZ")
    second = await storage.save(io.BytesIO(b"abc"), "a.zip")
    assert first != second
    assert sorted(p.name for p in tmp_path.iterdir()) == sorted([first, second])


async def test_a_name_that_is_a_path_does_not_make_a_file_outside_of_the_folder(tmp_path):
    folder = tmp_path / "uploads"
    name = await UploadStorage(str(folder)).save(io.BytesIO(b"abc"), "../../escape")
    assert name == "900150983CD24FB0D6963F7D28E17F72.escape"
    assert [p.name for p in folder.iterdir()] == [name]
    assert [p.name for p in tmp_path.iterdir()] == ["uploads"]


async def test_a_name_with_a_null_character_is_refused_and_writes_nothing(tmp_path):
    with pytest.raises(NullInFileNameError):
        await UploadStorage(str(tmp_path)).save(io.BytesIO(b"abc"), "a\x00.csv")
    assert list(tmp_path.iterdir()) == []


@pytest.mark.skipif(sys.platform == "win32", reason="Windows has no read permissions to set")
async def test_the_file_can_be_read_by_others_as_hintr_runs_as_another_user(tmp_path):
    name = await UploadStorage(str(tmp_path)).save(io.BytesIO(b"abc"), "a.csv")
    assert (tmp_path / name).stat().st_mode & 0o777 == 0o644


async def test_a_failure_while_writing_leaves_nothing_behind(tmp_path):
    class DiskFull(OSError):
        pass

    class Fails(io.BytesIO):
        def read(self, size: int | None = -1) -> bytes:
            raise DiskFull

    with pytest.raises(DiskFull):
        await UploadStorage(str(tmp_path)).save(Fails(), "a.csv")
    assert list(tmp_path.iterdir()) == []


async def test_a_file_that_is_in_the_folder_is_found_by_its_stored_name(tmp_path):
    storage = UploadStorage(str(tmp_path))
    name = await storage.save(io.BytesIO(b"abc"), "a.csv")

    assert await storage.has_file(name)
    assert not await storage.has_file("OTHER.csv")


async def test_a_folder_in_the_folder_is_not_a_file(tmp_path):
    (tmp_path / "folder").mkdir()

    assert not await UploadStorage(str(tmp_path)).has_file("folder")


async def test_a_folder_that_is_not_there_has_no_files(tmp_path):
    assert not await UploadStorage(str(tmp_path / "not-there")).has_file("a.csv")


@pytest.mark.parametrize(
    "name",
    ["", ".", "..", "sub/ABC.csv", "../outside.txt", "/etc/passwd", "sub\\ABC.csv", "..\\outside.txt", "a\x00.csv"],
    ids=repr,
)
async def test_a_name_that_is_not_the_name_of_a_file_of_the_folder_is_not_found(tmp_path, name):
    folder = tmp_path / "uploads"
    (folder / "sub").mkdir(parents=True)
    (folder / "sub" / "ABC.csv").write_bytes(b"x")
    (tmp_path / "outside.txt").write_bytes(b"x")
    (folder / "sub\\ABC.csv").write_bytes(b"x")

    assert not await UploadStorage(str(folder)).has_file(name)


def test_the_md5_of_a_file_is_in_upper_case_and_the_file_is_not_changed(tmp_path):
    path = tmp_path / "f"
    content = b"abc" * 1_000_000  # More than one piece
    path.write_bytes(content)

    assert md5_of_file(path) == hashlib.md5(content, usedforsecurity=False).hexdigest().upper()
    assert path.read_bytes() == content


def test_the_md5_of_an_empty_file(tmp_path):
    (tmp_path / "f").write_bytes(b"")

    assert md5_of_file(tmp_path / "f") == "D41D8CD98F00B204E9800998ECF8427E"
