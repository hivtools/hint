"""Review-input chart data and review-inputs metadata."""
from __future__ import annotations

import pytest

from hintcontract.flows import guest_open, login_and_open, upload


def base(scn, user=True, with_pjnz=True):
    a = login_and_open(scn) if user else guest_open(scn)
    with scn.quiet():
        upload(a, "shape")
        if with_pjnz:
            upload(a, "pjnz")
    return a


@pytest.mark.parametrize("kind", ["anc", "programme"])
def test_input_time_series_success(scn, kind):
    a = base(scn)
    upload(a, kind)
    r = a.get(f"/chart-data/input-time-series/{kind}")
    assert r.status == 200
    a.get(f"/chart-data/input-time-series/{kind.upper()}", name="type is case insensitive")
    a.get(f"/chart-data/input-time-series/{kind}", headers={"Accept-Language": "fr"}, name="in french")


def test_input_time_series_errors(scn):
    a = base(scn)
    a.get("/chart-data/input-time-series/not-a-real-type", name="unknown type")
    a.get("/chart-data/input-time-series/not-a-real-type", headers={"Accept-Language": "fr"}, name="unknown type fr")
    a.get("/chart-data/input-time-series/survey", name="survey is not a time series type")
    a.get("/chart-data/input-time-series/anc", name="anc not uploaded")
    a.get("/chart-data/input-time-series/programme", name="programme not uploaded")


def test_input_time_series_needs_shape_and_pjnz(scn):
    a = login_and_open(scn)
    a.post("/disease/anc", files={"file": "anc.csv"}, params={"strict": "false"}, name="anc without shape (rejected, stored)")
    a.get("/chart-data/input-time-series/anc", name="anc chart without shape")
    upload(a, "shape")
    upload(a, "programme", name="programme without pjnz, strict (rejected, stored)")
    a.get("/chart-data/input-time-series/programme", name="programme chart without pjnz")


def test_input_time_series_as_guest(scn):
    a = base(scn, user=False)
    upload(a, "anc")
    a.get("/chart-data/input-time-series/anc", name="guest")


def test_input_comparison(scn):
    a = base(scn)
    a.get("/chart-data/input-comparison", name="neither anc nor programme")
    upload(a, "anc")
    a.get("/chart-data/input-comparison", name="anc only")
    upload(a, "programme")
    a.get("/chart-data/input-comparison", name="anc and programme")
    a.delete("/disease/anc", name="remove anc")
    a.get("/chart-data/input-comparison", name="programme only")
    a.get("/chart-data/input-comparison", headers={"Accept-Language": "pt"}, name="in portuguese")


def test_input_comparison_without_baseline(scn):
    a = login_and_open(scn)
    a.get("/chart-data/input-comparison", name="nothing uploaded")


def test_input_population(scn):
    a = base(scn)
    a.get("/chart-data/input-population", name="no population")
    upload(a, "population")
    a.get("/chart-data/input-population", name="population")
    a.get("/chart-data/input-population", headers={"Accept-Language": "fr"}, name="in french")


def test_review_inputs_metadata(scn):
    a = base(scn)
    for k in ("anc", "programme", "survey"):
        with scn.quiet():
            upload(a, k)
    a.post("/meta/review-inputs/MWI", json={"types": ["anc", "programme", "survey", "shape"]}, name="all types")
    a.post("/meta/review-inputs/MWI", json={"types": ["anc"]}, name="anc only")
    a.post("/meta/review-inputs/MWI", json={"types": ["programme"]}, name="programme only")
    a.post("/meta/review-inputs/MWI", json={"types": ["survey"]}, name="survey only")
    a.post("/meta/review-inputs/MWI", json={"types": ["shape"]}, name="shape only")
    a.post("/meta/review-inputs/MWI", json={"types": ["ANC", "Survey"]}, name="type names are case insensitive")
    a.post("/meta/review-inputs/MWI", json={"types": []}, name="no types")
    a.post("/meta/review-inputs/MWI", json={"types": ["anc"]}, headers={"Accept-Language": "fr"}, name="in french")


def test_review_inputs_metadata_errors(scn):
    a = base(scn)
    a.post("/meta/review-inputs/MWI", json={"types": ["anc"]}, name="anc not uploaded")
    a.post("/meta/review-inputs/MWI", json={"types": ["population"]}, name="population is not a review type")
    a.post("/meta/review-inputs/MWI", json={"types": ["pjnz"]}, name="pjnz is not a review type")
    a.post("/meta/review-inputs/MWI", json={"types": ["anc", "bogus"]}, name="one bad type")
    a.post("/meta/review-inputs/MWI", json={"types": ["anc", "bogus"]}, headers={"Accept-Language": "fr"}, name="one bad type fr")
    a.post("/meta/review-inputs/MWI", json={}, name="types missing")
    a.post("/meta/review-inputs/MWI", json={"types": "anc"}, name="types not a list")
    a.post("/meta/review-inputs/MWI", name="no body")
    a.post("/meta/review-inputs/XXX", json={"types": ["shape"]}, name="iso3 not matching the shape")
    a.get("/meta/review-inputs/MWI", name="wrong method")
