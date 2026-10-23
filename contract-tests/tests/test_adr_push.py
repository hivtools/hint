"""Push outputs / inputs to the ADR: releases and resources (create, patch, hash-skip) against a stub CKAN."""
from __future__ import annotations

import pytest

from hintcontract.adr import API_KEY, SCHEMAS, md5_hex
from hintcontract.controls import fault
from hintcontract.flows import login_and_open, upload

OUT = {"outputZip": "spectrum", "outputSummary": "summary", "outputComparison": "comparison"}
INPUTS = {"pjnz": "Malawi2024.PJNZ", "shape": "malawi.geojson", "population": "population.csv", "survey": "survey.csv",
          "programme": "programme.csv", "anc": "anc.csv", "vmmc": "vmmc.xlsx"}


def session_with_key(scn):
    a = login_and_open(scn)
    with scn.quiet():
        a.post("/adr/key", form={"key": API_KEY})
    return a


def err(msg="boom"):
    return {"type": "status", "status": 500, "json": {"success": False, "error": {"message": msg}}}


# ----------------------------------------------------------------------------------------------- releases
def test_create_release_when_none_exists(scn):
    scn.set_stub(releases={"ds1": []})
    a = session_with_key(scn)
    r = a.post("/adr/datasets/ds1/releases", params={"name": "v1"}, name="create release")
    assert r.status == 200


def test_create_release_replaces_a_release_with_the_same_name(scn):
    scn.set_stub(releases={"ds1": [{"id": "old-1", "name": "v1"}, {"id": "other", "name": "v2"}]})
    a = session_with_key(scn)
    a.post("/adr/datasets/ds1/releases", params={"name": "v1"}, name="existing v1 is deleted first")
    a.post("/adr/datasets/ds1/releases", params={"name": "v3"}, name="no duplicate")
    a.post("/adr/datasets/ds1/releases", params={"name": "v1"}, headers={"Accept-Language": "fr"}, name="french header does not matter")


def test_create_release_failures(scn):
    scn.set_stub(releases={"ds1": [{"id": "old-1", "name": "v1"}]})
    a = session_with_key(scn)
    scn.set_faults("stub", [fault(err("list failed"), "dataset_version_list")])
    a.post("/adr/datasets/ds1/releases", params={"name": "v1"}, name="listing releases fails")
    scn.set_faults("stub", [fault(err("delete failed"), "version_delete")])
    a.post("/adr/datasets/ds1/releases", params={"name": "v1"}, name="deleting the duplicate fails")
    scn.set_faults("stub", [fault(err("create failed"), "dataset_version_create")])
    a.post("/adr/datasets/ds1/releases", params={"name": "v1"}, name="creating fails")
    scn.set_faults("stub", [fault({"type": "raw", "status": 200, "body": "garbage"}, "dataset_version_create")])
    a.post("/adr/datasets/ds1/releases", params={"name": "v9"}, name="garbage create response")
    scn.set_faults("stub", [fault({"type": "status", "status": 401, "json": {"success": False, "error": {"message": "auth"}}},
                                  "dataset_version_list")])
    a.post("/adr/datasets/ds1/releases", params={"name": "v9"}, name="401 on listing")
    a.post("/adr/datasets/ds1/releases", name="name missing")
    scn.set_faults("stub", [])


def test_create_release_without_key(scn):
    a = login_and_open(scn)
    a.post("/adr/datasets/ds1/releases", params={"name": "v1"}, name="no key")


# ----------------------------------------------------------------------------------------------- outputs
@pytest.mark.parametrize("schema_key", list(OUT))
def test_push_output_creates_a_new_resource(scn, pipeline, schema_key):
    pipeline.bind(scn)
    a = session_with_key(scn)
    did = pipeline.downloads[OUT[schema_key]]
    ext = "zip" if schema_key == "outputZip" else "html"
    r = a.post(f"/adr/datasets/ds1/resource/{SCHEMAS[schema_key]}/{did}",
               params={"resourceFileName": f"naomi-output.{ext}", "resourceName": "My output", "description": "desc text"},
               name="no resourceId: resource_create")
    assert r.status == 200


def test_push_output_updates_when_hash_differs_and_skips_when_same(scn, pipeline):
    pipeline.bind(scn)
    a = session_with_key(scn)
    did = pipeline.downloads["summary"]
    file_md5 = md5_hex(a.get(f"/download/result/{did}", name="fetch the file to learn its md5", binary="html").content)
    sch = SCHEMAS["outputSummary"]
    scn.set_stub(resources={"res-1": {"id": "res-1", "hash": "0" * 32}})
    params = {"resourceFileName": "report.html", "resourceName": "Report", "description": "d", "resourceId": "res-1"}
    a.post(f"/adr/datasets/ds1/resource/{sch}/{did}", params=params, name="stored hash differs: resource_patch")
    scn.set_stub(resources={"res-1": {"id": "res-1", "hash": file_md5.upper()}})
    r = a.post(f"/adr/datasets/ds1/resource/{sch}/{did}", params=params, name="stored hash identical: upload skipped")
    assert r.status == 200


def test_push_output_errors(scn, pipeline):
    pipeline.bind(scn)
    a = session_with_key(scn)
    did = pipeline.downloads["spectrum"]
    sch = SCHEMAS["outputZip"]
    p = {"resourceFileName": "o.zip", "resourceName": "n", "description": "d"}
    a.post(f"/adr/datasets/ds1/resource/{sch}/{did}", params={k: v for k, v in p.items() if k != "description"},
           name="description missing")
    a.post(f"/adr/datasets/ds1/resource/{sch}/{did}", params={k: v for k, v in p.items() if k != "resourceName"},
           name="resourceName missing")
    a.post(f"/adr/datasets/ds1/resource/{sch}/{did}", params={k: v for k, v in p.items() if k != "resourceFileName"},
           name="resourceFileName missing")
    a.post(f"/adr/datasets/ds1/resource/{sch}/nonsense", params=p, name="unknown download id")
    a.post(f"/adr/datasets/ds1/resource/{sch}/{pipeline.fit_id}", params=p, name="id of a model fit")
    a.post(f"/adr/datasets/ds1/resource/not-a-schema/{did}", params=p, name="unknown resource type")
    scn.set_faults("stub", [fault(err("create failed"), "resource_create")])
    a.post(f"/adr/datasets/ds1/resource/{sch}/{did}", params=p, name="adr resource_create returns an error")
    scn.set_faults("stub", [fault({"type": "close"}, "resource_create")])
    a.post(f"/adr/datasets/ds1/resource/{sch}/{did}", params=p, name="adr connection dropped")
    scn.set_faults("stub", [fault({"type": "raw", "status": 200, "body": "garbage"}, "resource_create")])
    a.post(f"/adr/datasets/ds1/resource/{sch}/{did}", params=p, name="adr garbage response")
    scn.set_faults("stub", [fault(err("show failed"), "resource_show")])
    a.post(f"/adr/datasets/ds1/resource/{sch}/{did}", params={**p, "resourceId": "res-1"}, name="resource_show fails")
    scn.set_faults("stub", [fault({"type": "status", "status": 404, "json": {"success": False, "error": {"message": "Not found"}}},
                                  "resource_show")])
    a.post(f"/adr/datasets/ds1/resource/{sch}/{did}", params={**p, "resourceId": "res-1"}, name="resource_show 404")


# ----------------------------------------------------------------------------------------------- inputs
@pytest.mark.parametrize("slot", list(INPUTS))
def test_push_input_file(scn, slot):
    needs_base = slot in ("survey", "programme", "anc", "vmmc")
    a = session_with_key(scn)
    with scn.quiet():
        if needs_base:
            upload(a, "shape")
            upload(a, "pjnz")
        upload(a, slot)
    fixture = INPUTS[slot]
    data = (scn.env.fixtures_dir / fixture).read_bytes()
    sch = SCHEMAS[slot]
    scn.set_stub(resources={"res-in": {"id": "res-in", "hash": "f" * 32}})
    base = {"resourceName": f"My {slot}", "resourceId": "res-in", "resourceFileName": "ignored.name"}
    a.post(f"/adr/datasets/ds1/resource/{sch}/ignored-download-id", params=base, name="hash differs: resource_patch")
    scn.set_stub(resources={"res-in": {"id": "res-in", "hash": md5_hex(data).upper()}})
    a.post(f"/adr/datasets/ds1/resource/{sch}/ignored-download-id", params=base, name="hash identical: skipped")


def test_push_input_errors(scn):
    a = session_with_key(scn)
    sch = SCHEMAS["pjnz"]
    base = {"resourceName": "n", "resourceId": "res-in", "resourceFileName": "f"}
    a.post(f"/adr/datasets/ds1/resource/{sch}/x", params=base, name="file not in session")
    with scn.quiet():
        upload(a, "pjnz")
    a.post(f"/adr/datasets/ds1/resource/{sch}/x", params={k: v for k, v in base.items() if k != "resourceId"},
           name="resourceId missing for an input type")
    scn.set_stub(resources={})
    a.post(f"/adr/datasets/ds1/resource/{sch}/x", params=base, name="resource unknown to the adr (resource_show 404)")
    scn.set_faults("stub", [fault(err("patch failed"), "resource_patch")])
    scn.set_stub(resources={"res-in": {"id": "res-in", "hash": "f" * 32}})
    a.post(f"/adr/datasets/ds1/resource/{sch}/x", params=base, name="resource_patch fails")
    a.post(f"/adr/datasets/ds1/resource/{sch}/x", params={k: v for k, v in base.items() if k != "resourceName"},
           name="resourceName missing")


def test_push_input_after_adr_import_uses_original_filename(scn):
    """The pushed file is copied to a temp dir under its original file name."""
    a = session_with_key(scn)
    with scn.quiet():
        upload(a, "pjnz")
    scn.set_stub(resources={"res-in": {"id": "res-in", "hash": "f" * 32}})
    a.post(f"/adr/datasets/ds1/resource/{SCHEMAS['pjnz']}/x",
           params={"resourceName": "n", "resourceId": "res-in", "resourceFileName": "will-be-ignored.PJNZ"},
           name="filename in the multipart upload")


def test_push_without_key_and_as_guest(scn):
    a = login_and_open(scn)
    a.post(f"/adr/datasets/ds1/resource/{SCHEMAS['pjnz']}/x", params={"resourceName": "n", "resourceId": "r", "resourceFileName": "f"},
           name="no key")
    g = scn.client("G")
    g.open_app()
    g.post(f"/adr/datasets/ds1/resource/{SCHEMAS['pjnz']}/x", params={"resourceName": "n", "resourceId": "r", "resourceFileName": "f"},
           name="guest")


def test_adr_metadata_for_upload(scn, pipeline):
    pipeline.bind(scn)
    a = session_with_key(scn)
    for t in ("spectrum", "summary", "comparison"):
        a.get(f"/meta/adr/{pipeline.downloads[t]}", name=f"metadata of {t}")
