"""How hint reports hintr failures: unavailable, slow, malformed, error statuses.  Uses the fault-injecting proxy
that sits on `hintr_url` (see scripts/dev.sh test)."""
from __future__ import annotations

import pytest

from hintcontract.controls import fault
from hintcontract.flows import login_and_open, upload

pytestmark = pytest.mark.faulting

VERSION_PATH = r"^/hintr/version$"


def hintr_json_failure(status=500):
    return {"status": "failure", "errors": [{"error": "SERVER_ERROR", "detail": "hintr exploded"}], "data": None}


def inject(scn, action, path=VERSION_PATH, method=None, times=None):
    scn.set_faults("hintr", [fault(action, path, method=method, times=times)])


@pytest.mark.quirk
def test_hintr_error_json_with_various_status_codes(scn):
    """quirk: any hintr status above 404 (409, 500, 503...) is turned into 500; 400-404 pass through."""
    a = scn.client("A")
    for status in (400, 401, 403, 404, 409, 500, 503):
        inject(scn, {"type": "status", "status": status, "json": hintr_json_failure(status)})
        a.get("/meta/hintr/version", name=f"hintr answers {status} with a hint-style error body")


@pytest.mark.quirk
def test_hintr_non_json_error_bodies(scn):
    """quirk: any body that is not JSON, including the HTML 502/504 pages of a gateway, gives 'Could not parse
    response.' (500). The Kotlin app used to answer 502/504 pages with ADR wording ('Failed to get response from ADR'),
    because hintr and ADR answers share one converter there. The Python API does not, and this was recorded again."""
    a = scn.client("A")
    cases = {
        "plain text 503": {"type": "status", "status": 503, "body": "Service Unavailable", "content_type": "text/plain"},
        "html 502 bad gateway": {"type": "status", "status": 502, "body": "<html><body><h1>502 Bad Gateway</h1></body></html>",
                                  "content_type": "text/html"},
        "html 504 gateway time-out": {"type": "status", "status": 504,
                                       "body": "<html><body><h1>504 Gateway Time-out</h1></body></html>", "content_type": "text/html"},
        "empty 500": {"type": "status", "status": 500, "body": "", "content_type": "text/plain"},
        "200 but not json": {"type": "raw", "status": 200, "body": "this is not json"},
        "200 truncated json": {"type": "raw", "status": 200, "body": '{"status": "succ'},
        "200 json without status": {"type": "raw", "status": 200, "body": '{"hello": "world"}'},
        "200 json string": {"type": "raw", "status": 200, "body": '"just a string"'},
        "200 json list": {"type": "raw", "status": 200, "body": "[1, 2, 3]"},
        "200 json null": {"type": "raw", "status": 200, "body": "null"},
        "500 json without status": {"type": "status", "status": 500, "json": {"message": "oops"}},
        "500 json string": {"type": "status", "status": 500, "json": "a string error"},
        "200 hint-style failure": {"type": "status", "status": 200, "json": hintr_json_failure()},
    }
    for label, action in cases.items():
        inject(scn, action)
        a.get("/meta/hintr/version", name=label)


def test_hintr_connection_dropped(scn):
    a = scn.client("A")
    inject(scn, {"type": "close"})
    a.get("/meta/hintr/version", name="connection closed without a response")


def test_hintr_slow_but_ok(scn):
    a = scn.client("A")
    inject(scn, {"type": "delay", "seconds": 3})
    r = a.get("/meta/hintr/version", name="3 seconds late")
    assert r.status == 200


@pytest.mark.slow
def test_hintr_timeout(scn):
    """hint's client timeout is 120s: a hintr that never answers produces 'No response returned'."""
    a = scn.client("A")
    inject(scn, {"type": "delay", "seconds": 130})
    # hint retries timed-out GETs on its own; how many retries have reached the proxy when it answers is timing dependent
    a.get("/meta/hintr/version", name="hintr hangs for 130s", skip_outbound=True)


def test_hintr_failure_on_upload_validation_keeps_the_upload(scn):
    a = login_and_open(scn)
    inject(scn, {"type": "status", "status": 503, "body": "down", "content_type": "text/plain"},
           path=r"^/validate/baseline-individual$")
    a.post("/baseline/pjnz", files={"file": "Malawi2024.PJNZ"}, name="validation fails because hintr is down")
    scn.set_faults("hintr", [])
    a.get("/baseline/pjnz", name="the file was stored and validates once hintr is back")
    scn.db_rows("version_file")
    scn.uploads()


def test_hintr_down_for_each_validation_endpoint(scn):
    a = login_and_open(scn)
    with scn.quiet():
        upload(a, "shape")
        upload(a, "pjnz")
    inject(scn, {"type": "close"}, path=".*")
    a.post("/baseline/population", files={"file": "population.csv"}, name="population upload")
    a.get("/baseline/validate", name="combined validation")
    a.post("/disease/anc", files={"file": "anc.csv"}, name="anc upload")
    a.get("/model/options", name="model options")
    a.get("/chart-data/input-population", name="chart data")
    a.post("/meta/review-inputs/MWI", json={"types": ["shape"]}, name="review inputs")
    a.get("/calibrate/options/MWI", name="calibrate options")
    a.get("/model/status/x", name="status")
    a.get("/model/result/x", name="result")
    a.post("/model/cancel/x", name="cancel")
    a.get("/calibrate/status/x", name="calibrate status")
    a.get("/download/status/x", name="download status")
    a.get("/meta/adr/x", name="adr metadata")
    a.get("/metrics", name="metrics")
    a.get("/baseline/pjnz", name="GET re-validation")


def test_download_result_when_hintr_fails(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    i = pipeline.downloads["summary"]
    inject(scn, {"type": "status", "status": 500, "json": hintr_json_failure()}, path=r"^/download/result/", method="HEAD")
    a.get(f"/download/result/{i}", name="HEAD answers 500")
    inject(scn, {"type": "close"}, path=r"^/download/result/", method="HEAD")
    a.get(f"/download/result/{i}", name="HEAD connection dropped")
    inject(scn, {"type": "status", "status": 404, "json": hintr_json_failure(404)}, path=r"^/download/result/", method="HEAD")
    a.get(f"/download/result/{i}", name="HEAD answers 404")


@pytest.mark.quirk
def test_metrics_with_unexpected_worker_status(scn):
    """quirk: /metrics always answers 200; a failing or malformed worker status is reported as zero workers."""
    a = scn.client("A")
    body = {"status": "success", "errors": None, "data": {"w1": "BUSY", "w2": "idle", "w3": "PAUSED", "w4": "EXITED",
                                                          "w5": "LOST", "w6": "SOMETHING_NEW", "w7": "idle"}}
    inject(scn, {"type": "status", "status": 200, "json": body}, path=r"^/hintr/worker/status$")
    a.get("/metrics", name="every worker state")
    inject(scn, {"type": "status", "status": 200, "json": {"status": "success", "errors": None, "data": {}}},
           path=r"^/hintr/worker/status$")
    a.get("/metrics", name="no workers")
    inject(scn, {"type": "raw", "status": 200, "body": "not json"}, path=r"^/hintr/worker/status$")
    a.get("/metrics", name="malformed worker status")
    inject(scn, {"type": "status", "status": 500, "body": "no", "content_type": "text/plain"}, path=r"^/hintr/worker/status$")
    a.get("/metrics", name="worker status endpoint failing")


def test_accept_language_is_forwarded_to_hintr(scn):
    a = scn.client("A")
    for lang in ("fr", "pt", "de", "fr-FR,fr;q=0.9,en;q=0.8"):
        a.get("/meta/hintr/version", headers={"Accept-Language": lang}, name=f"Accept-Language {lang}")
    a.get("/meta/hintr/version", name="no Accept-Language header defaults to en")


def test_metrics_normal(scn):
    r = scn.client("A").get("/metrics", name="normal metrics", ignore_body=True)
    assert r.text.startswith("running 1\n")
