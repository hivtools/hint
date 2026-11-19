"""Import files from the ADR into the session (/adr/{type}, /adr/output, /rehydrate/adr) against a stub CKAN."""
from __future__ import annotations

import json

import pytest

from hintcontract.adr import API_KEY, file_entry, resource_url
from hintcontract.controls import fault
from hintcontract.flows import login_and_open, make_zip, upload
from hintcontract.scenario import Upload

IMPORTS = {  # slot -> (fixture, needs shape+pjnz first)
    "pjnz": ("Malawi2024.PJNZ", False), "shape": ("malawi.geojson", False), "population": ("population.csv", False),
    "survey": ("survey.csv", True), "programme": ("programme.csv", True), "anc": ("anc.csv", True),
    "vmmc": ("vmmc.xlsx", True),
}


def session_with_key(scn, needs_baseline=False):
    a = login_and_open(scn)
    with scn.quiet():
        a.post("/adr/key", form={"key": API_KEY})
        if needs_baseline:
            upload(a, "shape")
            upload(a, "pjnz")
    return a


def stub_files(fixture, dataset="ds1", rid="res1", activity=True, name=None, **extra):
    fname = name or fixture
    path = f"/dataset/{dataset}/resource/{rid}/download/{fname}"
    state = {"files": {path: file_entry(fixture)}}
    if activity:
        state["activity"] = {dataset: [{"id": "activity-newest"}, {"id": "activity-older"}]}
    state.update(extra)
    return state


def body(scn, fixture, dataset="ds1", rid="res1", name=None, query="", **kw):
    url = resource_url(scn.env, dataset, rid, name or fixture) + query
    d = {"url": url, "datasetId": dataset, "resourceId": rid}
    d.update(kw)
    return d


@pytest.mark.parametrize("slot", list(IMPORTS))
def test_import_success(scn, slot):
    fixture, needs = IMPORTS[slot]
    scn.set_stub(**stub_files(fixture))
    a = session_with_key(scn, needs)
    r = a.post(f"/adr/{slot}", json=body(scn, fixture), name=f"import {slot}")
    assert r.status == 200
    a.get({"pjnz": "/baseline/pjnz", "shape": "/baseline/shape", "population": "/baseline/population",
           "survey": "/disease/survey", "programme": "/disease/programme", "anc": "/disease/anc",
           "vmmc": "/disease/vmmc"}[slot], name="GET re-validates the imported file")
    scn.db_rows("version_file")
    scn.uploads()


def test_import_url_variants(scn):
    fixture = "Malawi2024.PJNZ"
    scn.set_stub(**stub_files(fixture))
    a = session_with_key(scn)
    a.post("/adr/pjnz", json=body(scn, fixture, query="?activity_id=abc&x=1"), name="url with query string")
    scn.db_rows("version_file")
    a.post("/adr/pjnz", json={**body(scn, fixture), "resourceId": None}, name="resourceId null: resource_url is empty")
    scn.db_rows("version_file")
    a.post("/adr/pjnz", json={**body(scn, fixture), "resourceId": ""}, name="resourceId empty string")
    a.post("/adr/pjnz", json={"url": body(scn, fixture)["url"]}, name="only url (datasetId and resourceId default to empty)")
    scn.db_rows("version_file")
    a.post("/adr/pjnz", json={**body(scn, fixture), "unknown": 1}, name="extra json field ignored?")


def test_import_without_activity_list_gives_empty_resource_url(scn):
    fixture = "Malawi2024.PJNZ"
    scn.set_stub(**stub_files(fixture, activity=False))
    a = session_with_key(scn)
    a.post("/adr/pjnz", json=body(scn, fixture), name="no activities")
    scn.db_rows("version_file")


def test_import_activity_list_failures(scn):
    fixture = "Malawi2024.PJNZ"
    scn.set_stub(**stub_files(fixture))
    a = session_with_key(scn)
    for label, action in {
        "activity list 500": {"type": "status", "status": 500, "json": {"success": False, "error": {"message": "x"}}},
        "activity list garbage": {"type": "raw", "status": 200, "body": "garbage"},
        "activity list empty result": {"type": "status", "status": 200, "json": {"success": True, "result": []}},
        "activity list connection dropped": {"type": "close"},
    }.items():
        scn.set_faults("stub", [fault(action, "package_activity_list")])
        a.post("/adr/pjnz", json=body(scn, fixture), name=label)
        scn.db_rows("version_file")


def test_import_download_failures(scn):
    fixture = "Malawi2024.PJNZ"
    scn.set_stub(**stub_files(fixture))
    a = session_with_key(scn)
    dl = r"/download/"
    for label, action in {
        "download 404": {"type": "status", "status": 404, "body": "nope", "content_type": "text/plain"},
        "download 403": {"type": "status", "status": 403, "body": "no", "content_type": "text/plain"},
        "download 401": {"type": "status", "status": 401, "body": "no", "content_type": "text/plain"},
        "download 500": {"type": "status", "status": 500, "body": "err", "content_type": "text/plain"},
        "download 204": {"type": "status", "status": 204, "body": "", "content_type": "text/plain"},
        "download connection dropped": {"type": "close"},
    }.items():
        scn.set_faults("stub", [fault(action, dl)])
        a.post("/adr/pjnz", json=body(scn, fixture), name=label)
    scn.set_faults("stub", [fault({"type": "status", "status": 404, "body": "nope", "content_type": "text/plain"}, dl)])
    for lang in ("fr", "pt"):
        a.post("/adr/pjnz", json=body(scn, fixture), headers={"Accept-Language": lang}, name=f"download 404 in {lang}")
    scn.db_rows("version_file")
    scn.uploads()


@pytest.mark.quirk
def test_import_redirect_to_login_page_is_followed_and_saved(scn):
    """quirk: the download client follows redirects, so the 'no permission' 302 branch in the code is unreachable;
    the login page HTML is saved as the file and then rejected by hintr validation."""
    fixture = "Malawi2024.PJNZ"
    state = stub_files(fixture)
    state["files"]["/dataset/ds1/resource/res1/download/Malawi2024.PJNZ"] = {"redirect": "/adr/login-page"}
    scn.set_stub(**state)
    a = session_with_key(scn)
    a.post("/adr/pjnz", json=body(scn, fixture), name="redirected download")
    scn.db_rows("version_file")
    scn.uploads()


def test_import_wrong_file_type_for_slot(scn):
    scn.set_stub(**stub_files("malawi.geojson", name="shape.geojson"))
    a = session_with_key(scn)
    a.post("/adr/pjnz", json=body(scn, "malawi.geojson", name="shape.geojson"), name="geojson imported as pjnz")
    scn.db_rows("version_file")
    scn.uploads()


def test_import_needs_shape_for_disease_files(scn):
    scn.set_stub(**stub_files("anc.csv"))
    a = session_with_key(scn, needs_baseline=False)
    a.post("/adr/anc", json=body(scn, "anc.csv"), name="anc without shape/pjnz")
    scn.db_rows("version_file")
    a.post("/adr/anc", json=body(scn, "anc.csv"), params={"strict": "false"}, name="lax anc without shape")


def test_import_requests_errors(scn):
    scn.set_stub(**stub_files("Malawi2024.PJNZ"))
    a = login_and_open(scn)
    a.post("/adr/pjnz", json=body(scn, "Malawi2024.PJNZ"), name="no ADR key stored")
    a.post("/adr/key", form={"key": API_KEY}, name="store key")
    a.post("/adr/pjnz", name="no body")
    a.post("/adr/pjnz", json={}, name="empty json")
    a.post("/adr/pjnz", json={"datasetId": "x"}, name="url missing")
    a.post("/adr/pjnz", content_type="application/json", raw_body=b"{no", name="malformed json")
    a.post("/adr/pjnz", json={"url": "not a url"}, name="url is not a url")
    a.post("/adr/pjnz", json={"url": "ftp://example.com/x.PJNZ"}, name="unsupported scheme")
    a.post("/adr/bogus", json=body(scn, "Malawi2024.PJNZ"), name="unknown slot")
    a.get("/adr/pjnz", name="wrong method")


def test_import_output_zip(scn):
    zipbytes = make_zip({"info/project_state.json": "{}"})
    scn.set_stub(files={"/dataset/ds1/resource/res1/download/out.zip": {"b64": __import__("base64").b64encode(zipbytes).decode()}},
                 activity={"ds1": [{"id": "act-1"}]})
    a = session_with_key(scn)
    r = a.post("/adr/output", json=body(scn, "out.zip", name="out.zip"), name="import output zip")
    assert r.status == 200
    scn.db_rows("version_file")
    scn.db_rows("file")
    scn.uploads()
    a.post("/adr/output", json={"url": "http://127.0.0.1:1/none.zip"}, name="unreachable adr url")
    scn.set_faults("stub", [fault({"type": "status", "status": 404, "body": "x", "content_type": "text/plain"}, "/download/")])
    a.post("/adr/output", json=body(scn, "out.zip", name="out.zip"), name="download 404")


# ----------------------------------------------------------------------------------------------- rehydrate/adr
def test_rehydrate_from_adr(scn, pipeline):
    pipeline.bind(scn)
    state = {"datasets": {}, "model_fit": {"id": pipeline.fit_id, "options": {}},
             "calibrate": {"id": pipeline.calibrate_id, "options": {}}, "version": pipeline.version}
    zipbytes = make_zip({"info/project_state.json": json.dumps(state), "notes.txt": "adr notes"})
    scn.set_stub(files={"/dataset/ds1/resource/res1/download/out.zip": {"b64": __import__("base64").b64encode(zipbytes).decode()}})
    a = session_with_key(scn)
    a.post("/rehydrate/adr", json=body(scn, "out.zip", name="out.zip"), name="rehydrate from adr")
    bad = dict(state, calibrate={"id": "nonsense", "options": {}})
    z2 = make_zip({"info/project_state.json": json.dumps(bad)})
    scn.set_stub(files={"/dataset/ds1/resource/res1/download/bad.zip": {"b64": __import__("base64").b64encode(z2).decode()}})
    a.post("/rehydrate/adr", json=body(scn, "bad.zip", name="bad.zip"), name="unknown calibrate id inside the zip")
    z3 = make_zip({"other.txt": "x"})
    scn.set_stub(files={"/dataset/ds1/resource/res1/download/other.zip": {"b64": __import__("base64").b64encode(z3).decode()}})
    a.post("/rehydrate/adr", json=body(scn, "other.zip", name="other.zip"), name="zip not made by the app")
    scn.set_faults("stub", [fault({"type": "status", "status": 404, "body": "x", "content_type": "text/plain"}, "/download/")])
    a.post("/rehydrate/adr", json=body(scn, "out.zip", name="out.zip"), name="download 404")
    a.post("/rehydrate/adr", name="no body")


def test_rehydrate_from_adr_without_key_and_as_guest(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    a.post("/rehydrate/adr", json={"url": "http://x/y.zip"}, name="no key stored")
    g = scn.client("G")
    g.post("/rehydrate/adr", json={"url": "http://x/y.zip"}, name="guest has no key either")
