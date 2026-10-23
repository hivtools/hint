"""Rehydrate a project from an output zip (/rehydrate/zip).  /rehydrate/adr is in test_adr.py."""
from __future__ import annotations

import json

import pytest

from hintcontract.flows import guest_open, login_and_open, make_zip, upload
from hintcontract.scenario import Upload


def state(pipeline, datasets, fit="fit", cal="calibrate"):
    s = {"datasets": datasets,
         "model_fit": {"id": pipeline.fit_id if fit == "fit" else fit, "options": {}},
         "calibrate": {"id": pipeline.calibrate_id if cal == "calibrate" else cal, "options": {}},
         "version": pipeline.version}
    return s


def zip_upload(state_obj, notes: str | None = "project notes\nline 2", state_text: str | None = None,
               extra: dict | None = None, name="output.zip"):
    members = {}
    if state_obj is not None or state_text is not None:
        members["info/project_state.json"] = state_text if state_text is not None else json.dumps(state_obj)
    if notes is not None:
        members["notes.txt"] = notes
    members.update(extra or {})
    return Upload(name, make_zip(members), volatile=True)


def uploaded_datasets(a):
    """upload a pjnz and a shape and return a state.datasets map pointing at them."""
    ds = {}
    for kind in ("pjnz", "shape"):
        d = upload(a, kind).data
        ds[kind] = {"path": f"uploads/{d['hash']}", "filename": d["filename"], "hash": d["hash"]}
    return ds


def test_rehydrate_success(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    ds = uploaded_datasets(a)
    r = a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, ds))}, name="valid zip")
    assert r.status == 200
    a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, ds), notes=None)}, name="valid zip, no notes.txt")
    a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, {}))}, name="no datasets at all")
    scn.db_rows("version_file")


def test_rehydrate_success_as_guest_and_only_basename_of_path_matters(scn, pipeline):
    pipeline.bind(scn)
    a = guest_open(scn)
    d = upload(a, "pjnz").data
    ds = {"pjnz": {"path": f"/totally/different/dir/{d['hash']}", "filename": "x", "hash": d["hash"]}}
    a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, ds))}, name="guest, foreign directory in path")


def test_rehydrate_missing_input_file(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    ds = {"pjnz": {"path": "uploads/DEADBEEFDEADBEEFDEADBEEFDEADBEEF.PJNZ", "filename": "x", "hash": "x"}}
    a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, ds))}, name="file not on disk")
    for lang in ("fr", "pt"):
        a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, ds))}, headers={"Accept-Language": lang},
               name=f"file not on disk ({lang})")
    a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, {"pjnz": {"filename": "x"}}))},
           name="dataset without a path")
    a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, {"pjnz": {"path": None}}))},
           name="dataset with null path")


def test_rehydrate_unknown_task_ids(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, {}, fit="nonsense"))}, name="unknown model fit id")
    a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, {}, cal="nonsense"))}, name="unknown calibrate id")
    a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, {}, fit="nonsense"))},
           headers={"Accept-Language": "fr"}, name="unknown fit id (fr)")
    a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, {}, cal="nonsense"))},
           headers={"Accept-Language": "pt"}, name="unknown calibrate id (pt)")
    s = state(pipeline, {})
    del s["model_fit"]
    a.post("/rehydrate/zip", files={"file": zip_upload(s)}, name="no model_fit in state")
    s = state(pipeline, {})
    del s["calibrate"]
    a.post("/rehydrate/zip", files={"file": zip_upload(s)}, name="no calibrate in state")
    s = state(pipeline, {})
    s["model_fit"] = {"id": None}
    a.post("/rehydrate/zip", files={"file": zip_upload(s)}, name="null fit id")
    a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, {}, fit=pipeline.error_fit_id))},
           name="fit id of a failed fit (exists)")


def test_rehydrate_malformed_zips(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    a.post("/rehydrate/zip", files={"file": "output.zip"}, name="the real output.zip fixture (not from this app)")
    a.post("/rehydrate/zip", files={"file": zip_upload(None)}, name="zip without project_state.json")
    a.post("/rehydrate/zip", files={"file": Upload("o.zip", b"this is not a zip")}, name="not a zip at all")
    a.post("/rehydrate/zip", files={"file": Upload("o.zip", b"")}, name="empty file")
    a.post("/rehydrate/zip", files={"file": Upload("o.zip", make_zip({}))}, name="empty zip")
    a.post("/rehydrate/zip", files={"file": zip_upload(None, state_text="{not json")}, name="state is not valid json")
    a.post("/rehydrate/zip", files={"file": zip_upload(None, state_text="null")}, name="state is json null")
    a.post("/rehydrate/zip", files={"file": zip_upload(None, state_text="[1, 2]")}, name="state is a json array")
    a.post("/rehydrate/zip", files={"file": zip_upload(None, state_text="{}")}, name="state is an empty object")
    a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, {}), name="state.txt")}, name="any file name works")
    a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, {}), extra={"nested/info/project_state.json": "{}"})},
           name="extra members are ignored")


def test_rehydrate_bad_requests(scn, pipeline):
    a = login_and_open(scn)
    a.post("/rehydrate/zip", name="no body")
    a.post("/rehydrate/zip", files={"other": Upload("o.zip", b"x")}, name="wrong part name")
    a.post("/rehydrate/zip", json={"file": "x"}, name="json body")
    a.get("/rehydrate/zip", name="wrong method")
    a.post("/rehydrate/zip/", files={"file": "output.zip"}, name="trailing slash")


def test_rehydrate_does_not_touch_the_session(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    ds = uploaded_datasets(a)
    a.post("/rehydrate/zip", files={"file": zip_upload(state(pipeline, ds))}, name="valid zip")
    scn.db_rows("project")
    a.get("/projects/", name="no project created by rehydrate itself")
