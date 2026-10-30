"""POST /session/files : replace the session version's files by a map of hashes."""
from __future__ import annotations

import pytest

from hintcontract.flows import login_and_open, upload
from hintcontract.scenario import Upload


def file_entry(h, name="f.csv", from_adr=False, url=None):
    d = {"hash": h, "filename": name, "fromAdr": from_adr}
    if url is not None:
        d["resource_url"] = url
    return d


def two_files(scn):
    a = login_and_open(scn)
    pj = upload(a, "pjnz").data
    sh = upload(a, "shape").data
    return a, pj, sh


def test_set_files_replaces_everything(scn):
    a, pj, sh = two_files(scn)
    r = a.post("/session/files", json={"pjnz": file_entry(pj["hash"], pj["filename"])}, name="only pjnz")
    assert r.status == 200
    a.get("/baseline/shape", name="shape is gone")
    a.get("/baseline/pjnz", name="pjnz remains")
    scn.db_rows("version_file")


def test_set_files_empty_map_clears_all(scn):
    a, pj, sh = two_files(scn)
    a.post("/session/files", json={}, name="empty map")
    a.get("/baseline/pjnz")
    a.get("/baseline/shape")
    scn.db_rows("version_file")


def test_set_files_null_entries_are_skipped(scn):
    a, pj, sh = two_files(scn)
    a.post("/session/files", json={"pjnz": None, "shape": file_entry(sh["hash"], sh["filename"])}, name="null entry")
    a.get("/baseline/pjnz")
    scn.db_rows("version_file")


def test_set_files_with_resource_url_and_from_adr_flag(scn):
    a, pj, sh = two_files(scn)
    r = a.post("/session/files", json={"pjnz": file_entry(pj["hash"], "renamed.PJNZ", True, "http://x/y")},
               name="adr flag and resource_url are stored")
    scn.db_rows("version_file")


def test_set_files_unknown_hash_is_load_failed_and_nothing_changes(scn):
    a, pj, sh = two_files(scn)
    r = a.post("/session/files", json={"pjnz": file_entry("badhash")}, name="unknown hash")
    assert r.status == 400
    r = a.post("/session/files", json={"shape": file_entry(sh["hash"], sh["filename"]),
                                        "pjnz": file_entry("badhash")}, name="one good one unknown")
    a.post("/session/files", json={"pjnz": file_entry("badhash")}, headers={"Accept-Language": "fr"}, name="french")
    a.post("/session/files", json={"pjnz": file_entry("badhash")}, headers={"Accept-Language": "pt"}, name="portuguese")
    a.get("/baseline/pjnz", name="original files untouched (transaction rolled back)")
    a.get("/baseline/shape")
    scn.db_rows("version_file")


@pytest.mark.quirk
def test_set_files_has_no_ownership_check_on_hashes(scn):
    """quirk: any hash known to the `file` table can be attached by any session, whoever uploaded it."""
    a = login_and_open(scn, "A")
    pj = upload(a, "pjnz").data
    b = login_and_open(scn, "B", user="naomi-support@imperial.ac.uk")
    b.post("/session/files", json={"pjnz": file_entry(pj["hash"], "stolen.PJNZ")}, name="B attaches A's file")
    b.get("/baseline/pjnz", name="and can read the validated content")
    scn.db_rows("version_file")


@pytest.mark.quirk
def test_set_files_accepts_arbitrary_type_keys(scn):
    """quirk: the type key is not validated; unknown types are stored but never used."""
    a, pj, sh = two_files(scn)
    a.post("/session/files", json={"bogus": file_entry(pj["hash"], "x.PJNZ"), "outputzip": file_entry(sh["hash"])},
           name="unknown file type keys")
    scn.db_rows("version_file")
    a.get("/baseline/pjnz", name="pjnz slot now empty")


def test_set_files_malformed_requests(scn):
    a, pj, sh = two_files(scn)
    a.post("/session/files", name="no body")
    a.post("/session/files", content_type="application/json", raw_body=b"{not json", name="malformed json")
    a.post("/session/files", json=[1, 2], name="json array")
    a.post("/session/files", json={"pjnz": {"filename": "x"}}, name="entry without hash")
    a.post("/session/files", json={"pjnz": "abc"}, name="entry is a string")
    a.post("/session/files", json={"pjnz": file_entry(pj["hash"]), "extra": 1}, name="extra non-object entry")
    a.post("/session/files", form={"pjnz": "x"}, name="form encoded body")
    a.post("/session/files/", json={}, name="trailing slash")
    scn.db_rows("version_file")


def test_set_files_guest_session(scn):
    a = scn.client("A")
    a.open_app()
    pj = upload(a, "pjnz").data
    a.post("/session/files", json={"pjnz": file_entry(pj["hash"], pj["filename"])}, name="guest can set session files")
    a.get("/baseline/pjnz")


def test_set_files_before_opening_app(scn):
    a = scn.client("A")
    r = a.post("/session/files", json={}, name="empty map on a session with no version row")
    r = a.post("/session/files", json={"pjnz": file_entry("badhash")}, name="with a hash")
