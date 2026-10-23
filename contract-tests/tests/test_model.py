"""Model options, validation, run, status, result, cancel, comparison plot (mock model)."""
from __future__ import annotations

import pytest

from hintcontract.flows import (MODEL_OPTIONS, guest_open, login_and_open, upload, upload_minimal)
from hintcontract.pipeline import done
from hintcontract.scenario import Upload


def ready_session(scn, user=True, extra=()):
    a = login_and_open(scn) if user else guest_open(scn)
    with scn.quiet():
        upload_minimal(a)
        for k in extra:
            upload(a, k)
    return a


# ----------------------------------------------------------------------------------------------- options
@pytest.mark.parametrize("user", ["guest", "user"])
def test_model_options_success(scn, user):
    a = ready_session(scn, user == "user")
    r = a.get("/model/options/")
    assert r.status == 200 and "version" in r.json()


def test_model_options_with_programme_and_anc_data(scn):
    a = ready_session(scn, extra=("programme", "anc"))
    a.get("/model/options/", name="options with programme and anc")


def test_model_options_translated(scn):
    a = ready_session(scn)
    for lang in ("fr", "pt"):
        a.get("/model/options/", headers={"Accept-Language": lang}, name=f"options in {lang}")


def test_model_options_missing_files(scn):
    a = login_and_open(scn)
    a.get("/model/options/", name="no files at all")
    upload(a, "shape")
    a.get("/model/options/", name="shape only")
    upload(a, "survey", name="survey without pjnz (strict) fails but is stored")
    a.get("/model/options/", name="shape + a stored survey")


def test_model_options_ignores_population_and_pjnz(scn):
    a = login_and_open(scn)
    with scn.quiet():
        upload(a, "shape")
        upload(a, "pjnz")
        upload(a, "survey")
    a.get("/model/options/", name="shape+survey is enough")


# ----------------------------------------------------------------------------------------------- validate options
def test_validate_options_valid(scn):
    a = ready_session(scn)
    r = a.post("/model/validate/options/", json={"options": MODEL_OPTIONS, "version": {}, "iso3": None})
    assert r.status == 200


def test_validate_options_invalid(scn):
    a = ready_session(scn)
    a.post("/model/validate/options/", json={"options": {}, "version": {}, "iso3": None}, name="no options")
    a.post("/model/validate/options/", json={"options": {"area_level": "bogus"}, "version": {}, "iso3": None},
           name="bogus value, other options missing")
    bad = dict(MODEL_OPTIONS, area_level="99")
    a.post("/model/validate/options/", json={"options": bad, "version": {}, "iso3": None}, name="area level 99")
    bad = dict(MODEL_OPTIONS, calendar_quarter_t1="CY2030Q9")
    a.post("/model/validate/options/", json={"options": bad, "version": {}, "iso3": None}, name="bad quarter")
    extra = dict(MODEL_OPTIONS, not_a_real_option="x")
    a.post("/model/validate/options/", json={"options": extra, "version": {}, "iso3": None}, name="unknown option")
    for lang in ("fr", "pt"):
        a.post("/model/validate/options/", json={"options": {}, "version": {}, "iso3": None},
               headers={"Accept-Language": lang}, name=f"missing options in {lang}")


def test_validate_options_with_programme_data_conflicting_art_options(scn):
    a = ready_session(scn, extra=("programme", "anc"))
    a.post("/model/validate/options/", json={"options": MODEL_OPTIONS, "version": {}, "iso3": None})


def test_validate_options_without_files(scn):
    a = login_and_open(scn)
    a.post("/model/validate/options/", json={"options": MODEL_OPTIONS, "version": {}, "iso3": None})


def test_validate_options_bad_requests(scn):
    a = ready_session(scn)
    a.post("/model/validate/options/", name="no body")
    a.post("/model/validate/options/", json={"foo": 1}, name="wrong fields")
    a.post("/model/validate/options/", json={"options": "text", "version": {}, "iso3": None}, name="options not an object")
    a.post("/model/validate/options/", content_type="application/json", raw_body=b"{nope", name="malformed json")
    a.post("/model/validate/options/", json={"options": {}}, name="version missing")
    a.get("/model/validate/options/", name="wrong method")


# ----------------------------------------------------------------------------------------------- run
def test_run_status_result_cycle(scn):
    a = ready_session(scn)
    opts = a.get("/model/options/", name="options").json()
    r = a.post("/model/run/", json={"options": MODEL_OPTIONS, "version": opts["version"], "iso3": "MWI"},
               name="run", bind_task="run")
    a.poll(f"/model/status/{r.data['id']}", done, "data.done == true", name="status until done")
    a.get(f"/model/result/{r.data['id']}", name="result")
    a.get(f"/model/comparison/plot/{r.data['id']}", name="comparison plot of a fit (not a calibration)")


def test_run_that_fails_deterministically(scn):
    """mock_model_trigger_error=true makes the mock model stop immediately."""
    a = ready_session(scn)
    opts = a.get("/model/options/", name="options").json()
    bad = dict(MODEL_OPTIONS, mock_model_trigger_error="true")
    r = a.post("/model/run/", json={"options": bad, "version": opts["version"], "iso3": "MWI"}, name="run", bind_task="err")
    a.poll(f"/model/status/{r.data['id']}", done, "data.done == true", name="status")
    a.get(f"/model/result/{r.data['id']}", name="result is the model error")
    a.get(f"/model/result/{r.data['id']}", headers={"Accept-Language": "fr"}, name="result in french")
    a.post(f"/model/cancel/{r.data['id']}", name="cancel a finished task")


def test_mock_model_accepts_garbage_options(scn):
    a = ready_session(scn)
    opts = a.get("/model/options/", name="options").json()
    r = a.post("/model/run/", json={"options": {"area_level": "bogus"}, "version": opts["version"], "iso3": "MWI"},
               name="garbage options", bind_task="garbage")
    a.poll(f"/model/status/{r.data['id']}", done, "data.done == true", name="status")
    a.get(f"/model/result/{r.data['id']}", name="result")


def test_run_without_input_files(scn):
    a = login_and_open(scn)
    r = a.post("/model/run/", json={"options": MODEL_OPTIONS, "version": {"hintr": "1", "naomi": "1", "rrq": "1"},
                                    "iso3": "MWI"}, name="run with no files", bind_task="nofiles")
    if r.status == 200:
        a.poll(f"/model/status/{r.data['id']}", done, "data.done == true", name="status")
        a.get(f"/model/result/{r.data['id']}", name="result")


def test_run_bad_requests(scn):
    a = ready_session(scn)
    ver = {"hintr": "1", "naomi": "1", "rrq": "1"}
    a.post("/model/run/", json={"options": MODEL_OPTIONS, "version": {}, "iso3": "MWI"}, name="empty version")
    a.post("/model/run/", json={"options": MODEL_OPTIONS, "version": ver}, name="no iso3")
    a.post("/model/run/", json={"options": MODEL_OPTIONS, "version": ver, "iso3": 5}, name="iso3 not a string")
    a.post("/model/run/", name="no body")
    a.post("/model/run/", json={}, name="empty object")
    a.post("/model/run/", content_type="application/json", raw_body=b"[1,2]", name="array")
    a.post("/model/run/", json={"options": MODEL_OPTIONS, "version": {}, "iso3": "MWI"},
           headers={"Accept-Language": "fr"}, name="empty version in french")


# ----------------------------------------------------------------------------------------------- status/result/cancel
def test_status_result_of_unknown_ids(scn):
    a = login_and_open(scn)
    a.get("/model/status/nonsense", name="status unknown")
    a.get("/model/result/nonsense", name="result unknown")
    a.get("/model/result/nonsense", headers={"Accept-Language": "fr"}, name="result unknown fr")
    a.get("/model/result/nonsense", headers={"Accept-Language": "pt"}, name="result unknown pt")
    a.post("/model/cancel/nonsense", name="cancel unknown")
    a.get("/model/comparison/plot/nonsense", name="comparison plot unknown")
    a.get("/model/status/", name="empty id")


def test_status_and_result_of_pipeline_fit(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    a.get(f"/model/status/{pipeline.fit_id}", name="completed fit status")
    a.get(f"/model/result/{pipeline.fit_id}", name="completed fit result")
    a.get(f"/model/status/{pipeline.error_fit_id}", name="failed fit status")
    a.get(f"/model/result/{pipeline.error_fit_id}", name="failed fit result")
    a.post(f"/model/cancel/{pipeline.fit_id}", name="cancel completed fit")
    guest = scn.client("G")
    guest.get(f"/model/status/{pipeline.fit_id}", name="guest can read the same status")


@pytest.mark.quirk
def test_task_ids_are_a_single_namespace(scn, pipeline):
    """quirk: model/status and model/result accept calibrate task ids too (hintr has one task store)."""
    pipeline.bind(scn)
    a = login_and_open(scn)
    a.get(f"/model/status/{pipeline.calibrate_id}", name="calibrate id on model status")
    a.get(f"/model/result/{pipeline.calibrate_id}", name="calibrate id on model result")
    a.get(f"/calibrate/status/{pipeline.fit_id}", name="fit id on calibrate status")
    a.get(f"/download/status/{pipeline.fit_id}", name="fit id on download status")


def test_cancel_running_model(scn):
    a = ready_session(scn)
    opts = a.get("/model/options/", name="options").json()
    r = a.post("/model/run/", json={"options": MODEL_OPTIONS, "version": opts["version"], "iso3": "MWI"},
               name="run", bind_task="to-cancel")
    # wait until the worker has really started (progress appears), then cancel
    a.poll(f"/model/status/{r.data['id']}", lambda x: x.json()["data"]["status"] == "RUNNING" and x.json()["data"]["progress"],
           "status == RUNNING and progress reported", name="running")
    a.post(f"/model/cancel/{r.data['id']}", name="cancel")
    a.poll(f"/model/status/{r.data['id']}", done, "data.done == true", name="status after cancel")
    a.get(f"/model/result/{r.data['id']}", name="result of cancelled fit")
    a.post(f"/model/cancel/{r.data['id']}", name="cancel again")


# ----------------------------------------------------------------------------------------------- comparison plot
def test_comparison_plot(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    a.get(f"/model/comparison/plot/{pipeline.calibrate_id}", name="comparison plot of calibration")
    a.get(f"/model/comparison/plot/{pipeline.error_calibrate_id}", name="comparison plot of failed calibration")
    a.get(f"/model/comparison/plot/{pipeline.error_fit_id}", name="comparison plot of failed fit")
    a.get(f"/model/comparison/plot/{pipeline.calibrate_id}", headers={"Accept-Language": "fr"}, name="in french")
