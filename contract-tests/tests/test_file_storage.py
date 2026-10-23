"""How uploads are stored: content-hash naming, de-duplication, extensions, shared files between versions."""
from __future__ import annotations

import hashlib

import pytest

from hintcontract.flows import create_project, login_and_open, md5_upper, upload
from hintcontract.scenario import Upload


def fx(scn, name) -> bytes:
    return (scn.env.fixtures_dir / name).read_bytes()


def test_file_name_is_uppercase_md5_of_content_plus_extension(scn):
    a = login_and_open(scn)
    r = upload(a, "pjnz")
    data = fx(scn, "Malawi2024.PJNZ")
    assert r.data["hash"] == f"{md5_upper(data)}.PJNZ"
    scn.uploads()
    scn.db_rows("file")


def test_same_content_twice_is_stored_once(scn):
    a = login_and_open(scn)
    upload(a, "pjnz")
    upload(a, "pjnz", name="upload identical content again")
    scn.uploads()
    scn.db_rows("file")
    scn.db_rows("version_file")


def test_same_content_in_two_kinds_of_slot_shares_the_file(scn):
    """The same bytes uploaded as `anc` and as `programme` (csv for both) is one file on disk and two rows."""
    a = login_and_open(scn)
    upload(a, "shape")
    upload(a, "pjnz")
    data = fx(scn, "anc.csv")
    a.post("/disease/anc/", files={"file": Upload("data.csv", data)}, name="anc slot")
    a.post("/disease/programme/", files={"file": Upload("data.csv", data)}, name="programme slot (will be rejected)")
    scn.uploads()
    scn.db_rows("file")
    scn.db_rows("version_file")


def test_same_content_with_different_extension_is_stored_twice(scn):
    a = login_and_open(scn)
    data = fx(scn, "Malawi2024.PJNZ")
    a.post("/baseline/pjnz/", files={"file": Upload("a.PJNZ", data)}, name="a.PJNZ")
    a.post("/baseline/pjnz/", files={"file": Upload("a.zip", data)}, name="same bytes as a.zip")
    scn.uploads()
    scn.db_rows("file")


@pytest.mark.quirk
def test_filename_without_dot_uses_whole_name_as_extension(scn):
    """quirk: hash name is HASH.<text after the last dot>; with no dot that is the whole file name."""
    a = login_and_open(scn)
    a.post("/baseline/pjnz/", files={"file": Upload("README", b"abc")}, name="no dot")
    a.post("/baseline/pjnz/", files={"file": Upload("archive.tar.gz", b"abc")}, name="two dots")
    a.post("/baseline/pjnz/", files={"file": Upload("trailing.", b"abc")}, name="trailing dot")
    a.post("/baseline/pjnz/", files={"file": Upload("UPPER.CSV", b"abc")}, name="upper case extension")
    a.post("/baseline/pjnz/", files={"file": Upload("café ☃.pjnz", b"abcd")}, name="unicode and space in name")
    scn.uploads()
    scn.db_rows("version_file")


def test_original_filename_is_kept_in_the_response_and_db(scn):
    a = login_and_open(scn)
    r = a.post("/baseline/pjnz/", files={"file": Upload("my weird name (1).PJNZ", fx(scn, "Malawi2024.PJNZ"))},
               name="filename with spaces and parentheses")
    assert r.data["filename"] == "my weird name (1).PJNZ"
    scn.db_rows("version_file")


def test_same_file_is_shared_between_versions_and_survives_delete(scn):
    a = login_and_open(scn)
    p = create_project(a, "p").data
    v1 = p["versions"][0]["id"]
    upload(a, "pjnz")
    v2 = a.post(f"/project/{p['id']}/version/", params={"parent": v1}, name="v2 copies file refs").data["id"]
    a.delete("/baseline/pjnz/", name="remove from v2")
    scn.db_rows("version_file")
    scn.db_rows("file")
    scn.uploads()
    a.post("/project/%s/version/%s/state" % (p["id"], v2), content_type="application/json", raw_body=b"{}", name="state")
    a.get(f"/project/{p['id']}/version/{v1}", name="v1 still has the file")
    a.get("/baseline/pjnz/", name="so the session (now v1) validates it")


def test_two_users_uploading_same_file_share_one_stored_file(scn):
    a = login_and_open(scn, "A")
    b = login_and_open(scn, "B", user="naomi-support@imperial.ac.uk")
    upload(a, "pjnz")
    upload(b, "pjnz")
    scn.uploads()
    scn.db_rows("file")
    scn.db_rows("version_file")


@pytest.mark.needs_uploads
@pytest.mark.quirk
def test_file_row_present_but_file_missing_on_disk(scn):
    """quirk: if the stored file disappears the hintr error is passed through, and re-uploading the same content does
    NOT restore it (the hash is already in the file table so nothing is written)."""
    a = login_and_open(scn)
    upload(a, "pjnz")
    for p in scn.env.uploads_dir.iterdir():
        p.unlink()
    a.get("/baseline/pjnz/", name="file removed behind hint's back")
    upload(a, "pjnz", name="re-upload does not rewrite because the hash is already known")
    scn.uploads("file is NOT restored by re-upload")
    a.get("/baseline/pjnz/", name="still broken")


def test_large_binary_upload_roundtrip_hash(scn):
    a = login_and_open(scn)
    data = bytes((i * 7) % 256 for i in range(3_000_000))
    a.post("/baseline/pjnz/", files={"file": Upload("big.PJNZ", data)}, name="3MB garbage as pjnz")
    scn.uploads()
    assert hashlib.md5(data).hexdigest().upper()
