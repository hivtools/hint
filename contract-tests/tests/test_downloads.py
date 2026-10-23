"""Download outputs: submit / status / result, and the ADR upload metadata."""
from __future__ import annotations

import pytest

from hintcontract.flows import download_payload, guest_open, login_and_open, upload
from hintcontract.pipeline import DOWNLOAD_TYPES, done


def test_submit_with_and_without_vmmc_and_pjnz(scn, pipeline):
    """spectrum/datapack add the session's VMMC file when there is one; agyw always adds the PJNZ entry."""
    pipeline.bind(scn)
    a = login_and_open(scn)
    cid, fid = pipeline.calibrate_id, pipeline.fit_id
    payload = download_payload(fid, cid)
    for t in ("spectrum", "datapack"):
        a.post(f"/download/submit/{t}/{cid}", json=payload, name=f"{t}: session without vmmc", bind_task=f"s-{t}-novmmc")
    a.post(f"/download/submit/agyw/{cid}", json=payload, name="agyw: session without pjnz")
    with scn.quiet():
        upload(a, "vmmc", name="vmmc")
        upload(a, "pjnz", name="pjnz")
    for t in ("spectrum", "datapack"):
        a.post(f"/download/submit/{t}/{cid}", json=payload, name=f"{t}: session with vmmc", bind_task=f"s-{t}-vmmc")
    a.post(f"/download/submit/agyw/{cid}", json=payload, name="agyw: session with pjnz", bind_task="s-agyw")
    for t in ("summary", "comparison", "coarse-output"):
        a.post(f"/download/submit/{t}/{cid}", json=payload, name=f"{t}: nothing added", bind_task=f"s-{t}")


def test_submit_underscore_type_name(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    a.post(f"/download/submit/coarse_output/{pipeline.calibrate_id}", json=download_payload(pipeline.fit_id, pipeline.calibrate_id),
           name="coarse_output with underscore", bind_task="underscore")


def test_submit_errors(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    cid, fid = pipeline.calibrate_id, pipeline.fit_id
    ok = download_payload(fid, cid)
    a.post(f"/download/submit/bogus/{cid}", json=ok, name="unknown type")
    a.post(f"/download/submit/spectrum/nonsense", json=ok, name="unknown calibrate id")
    a.post(f"/download/submit/spectrum/nonsense", json=ok, headers={"Accept-Language": "fr"}, name="unknown id fr")
    a.post(f"/download/submit/spectrum/{pipeline.error_calibrate_id}", json=ok, name="failed calibration id")
    a.post(f"/download/submit/spectrum/{fid}", json=ok, name="a fit id instead of a calibrate id", bind_task="from-fit")
    a.post(f"/download/submit/spectrum/{cid}", name="no body")
    a.post(f"/download/submit/spectrum/{cid}", json={}, name="empty object (iso3 required)")
    a.post(f"/download/submit/spectrum/{cid}", json={"iso3": "MWI"}, name="iso3 only")
    a.post(f"/download/submit/spectrum/{cid}", json={"iso3": "MWI", "extra": 1}, name="extra property")
    a.post(f"/download/submit/spectrum/{cid}", json={"iso3": "MWI", "notes": {"project_notes": {"note": "x", "updated": "bad"}}},
           name="invalid notes")
    a.post(f"/download/submit/spectrum/{cid}", content_type="application/json", raw_body=b"{nope", name="malformed json")


def test_submit_minimal_payload_is_accepted(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    a.post(f"/download/submit/summary/{pipeline.calibrate_id}", json={"iso3": "MWI"}, name="iso3 only for summary",
           bind_task="min")


def test_invalid_download_type_fails_inside_hintr(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    r = a.post(f"/download/submit/bogus/{pipeline.calibrate_id}", json={"iso3": "MWI"}, name="bogus type, minimal payload",
               bind_task="bogus")
    if r.status == 200:
        a.poll(f"/download/status/{r.data['id']}", done, "data.done == true", name="status")
        a.get(f"/download/result/{r.data['id']}", name="result")


@pytest.mark.parametrize("dtype", DOWNLOAD_TYPES)
def test_status_and_result_of_each_type(scn, pipeline, dtype):
    pipeline.bind(scn)
    a = login_and_open(scn)
    i = pipeline.downloads[dtype]
    a.get(f"/download/status/{i}", name="status")
    r = a.get(f"/download/result/{i}", name="result", binary="zip")
    assert r.status == 200
    a.get(f"/meta/adr/{i}", name="adr metadata")
    a.get(f"/download/result/{i}", name="result as guest-less second download", binary="zip", headers={"Accept-Language": "fr"})


def test_download_result_and_metadata_errors(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    a.get("/download/status/nonsense", name="status unknown")
    a.get("/download/result/nonsense", name="result unknown")
    a.get("/download/result/nonsense", headers={"Accept-Language": "fr"}, name="result unknown fr")
    a.get("/meta/adr/nonsense", name="adr metadata unknown")
    a.get(f"/download/result/{pipeline.fit_id}", name="result of a model fit")
    a.get(f"/download/result/{pipeline.calibrate_id}", name="result of a calibration")
    a.get(f"/meta/adr/{pipeline.fit_id}", name="adr metadata of a fit")


def test_download_as_guest(scn, pipeline):
    pipeline.bind(scn)
    g = scn.client("G")
    g.get(f"/download/status/{pipeline.downloads['summary']}", name="guest status")
    g.get(f"/download/result/{pipeline.downloads['summary']}", name="guest result", binary="html")
    g.post(f"/download/submit/summary/{pipeline.calibrate_id}", json={"iso3": "MWI"}, name="guest submit", bind_task="g")
