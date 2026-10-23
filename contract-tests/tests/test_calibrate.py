"""Calibration: options, submit, status, results (metadata, plot, filtered data, indicator data)."""
from __future__ import annotations

import itertools

import pytest

from hintcontract.flows import CALIBRATE_OPTIONS, login_and_open
from hintcontract.pipeline import done

VERSION = {"hintr": "1", "naomi": "1", "rrq": "1"}


def body(pipeline, options=None, iso3="MWI"):
    return {"options": CALIBRATE_OPTIONS if options is None else options, "version": pipeline.version, "iso3": iso3}


def test_calibrate_options(scn):
    a = login_and_open(scn)
    a.get("/calibrate/options/MWI", name="MWI")
    a.get("/calibrate/options/MWI", headers={"Accept-Language": "fr"}, name="MWI in french")
    a.get("/calibrate/options/MWI", headers={"Accept-Language": "pt"}, name="MWI in portuguese")
    a.get("/calibrate/options/XXX", name="any iso3 is accepted")
    guest = scn.client("G")
    guest.get("/calibrate/options/MWI", name="guest")


def test_calibrate_submit_errors(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    a.post("/calibrate/submit/nonsense", json=body(pipeline), name="unknown model fit id")
    a.post("/calibrate/submit/nonsense", json=body(pipeline), headers={"Accept-Language": "fr"}, name="unknown id in french")
    a.post(f"/calibrate/submit/{pipeline.error_fit_id}", json=body(pipeline), name="failed model fit")
    a.post(f"/calibrate/submit/{pipeline.calibrate_id}", json=body(pipeline), name="a calibrate id instead of a fit id", bind_task="from-calibrate")
    a.post(f"/calibrate/submit/{pipeline.fit_id}", name="no body")
    a.post(f"/calibrate/submit/{pipeline.fit_id}", json={"options": {}}, name="missing version")
    a.post(f"/calibrate/submit/{pipeline.fit_id}", json={"version": VERSION, "iso3": "MWI"}, name="missing options")
    a.post(f"/calibrate/submit/{pipeline.fit_id}", json={"options": CALIBRATE_OPTIONS, "version": {}, "iso3": "MWI"},
           name="empty version")


def test_calibrate_submit_valid_then_status_and_results(scn, pipeline):
    """A fresh calibration of the pipeline fit (the pipeline's own calibration is verified in its golden)."""
    pipeline.bind(scn)
    a = login_and_open(scn)
    r = a.post(f"/calibrate/submit/{pipeline.fit_id}", json=body(pipeline, dict(CALIBRATE_OPTIONS, calibrate_method="proportional")),
               name="submit with method proportional", bind_task="fresh")
    cid = r.data["id"]
    a.poll(f"/calibrate/status/{cid}", done, "data.done == true", name="status until done")
    a.get(f"/calibrate/result/metadata/{cid}", name="metadata")
    a.get(f"/calibrate/plot/{cid}", name="plot")


def test_calibrate_with_invalid_options_fails(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    for label, opts in {"bad method": dict(CALIBRATE_OPTIONS, calibrate_method="bogus"),
                        "bad level": dict(CALIBRATE_OPTIONS, spectrum_plhiv_calibration_level="galaxy"),
                        "missing options": {}}.items():
        r = a.post(f"/calibrate/submit/{pipeline.fit_id}", json=body(pipeline, opts), name=label, bind_task=label.replace(" ", "-"))
        if r.status == 200:
            a.poll(f"/calibrate/status/{r.data['id']}", done, "data.done == true", name=f"{label}: status")
            a.get(f"/calibrate/result/metadata/{r.data['id']}", name=f"{label}: result")
            a.get(f"/calibrate/result/metadata/{r.data['id']}", headers={"Accept-Language": "fr"},
                  name=f"{label}: result in french")


def test_calibrate_status_and_results_of_pipeline(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    a.get(f"/calibrate/status/{pipeline.calibrate_id}", name="status")
    a.get(f"/calibrate/status/{pipeline.error_calibrate_id}", name="status of failed calibration")
    a.get(f"/calibrate/result/metadata/{pipeline.calibrate_id}", name="metadata")
    a.get(f"/calibrate/result/metadata/{pipeline.calibrate_id}", headers={"Accept-Language": "fr"}, name="metadata fr")
    a.get(f"/calibrate/plot/{pipeline.calibrate_id}", name="plot")
    a.get(f"/calibrate/plot/{pipeline.calibrate_id}", headers={"Accept-Language": "pt"}, name="plot pt")


def test_calibrate_results_of_unknown_and_failed_tasks(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    a.get("/calibrate/status/nonsense", name="status unknown")
    a.get("/calibrate/result/metadata/nonsense", name="metadata unknown")
    a.get("/calibrate/plot/nonsense", name="plot unknown")
    a.get(f"/calibrate/result/metadata/{pipeline.error_calibrate_id}", name="metadata of failed calibration")
    a.get(f"/calibrate/plot/{pipeline.error_calibrate_id}", name="plot of failed calibration")
    a.get(f"/calibrate/result/metadata/{pipeline.error_fit_id}", name="metadata of failed fit")


@pytest.mark.quirk
def test_calibrate_results_with_a_model_fit_id(scn, pipeline):
    """quirk: a fit id is accepted where a calibrate id is expected; hintr then returns odd data or a 500."""
    pipeline.bind(scn)
    a = login_and_open(scn)
    a.get(f"/calibrate/result/metadata/{pipeline.fit_id}", name="metadata of a fit (hintr SERVER_ERROR)")
    a.get(f"/calibrate/plot/{pipeline.fit_id}", name="plot of a fit")
    fd(a, f"/calibrate/result/filteredData/{pipeline.fit_id}", json=all_filter(), name="filteredData of a fit")


# ---------------------------------------------------------------------------------------- filtered data
def fd(a, path, **kw):
    """filteredData / data endpoints: row order comes from an un-ordered DuckDB query, so it is not part of the contract"""
    kw.setdefault("unordered", ["data"])
    return a.post(path, **kw)


def dd(a, path, **kw):
    kw.setdefault("unordered", ["data"])
    return a.get(path, **kw)


def all_filter(**kw):
    f = {"indicator": None, "calendar_quarter": None, "age_group": None, "sex": None, "area_id": None, "area_level": None}
    f.update(kw)
    return f


def test_filtered_data_single_filters(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    cid = pipeline.calibrate_id
    fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(indicator=["prevalence"], area_level=["0"]),
           name="indicator + area level")
    fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(indicator=["prevalence", "art_coverage"]),
           name="two indicators")
    fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(calendar_quarter=["CY2020Q3"], indicator=["plhiv"],
                                                                    area_level=["1"]), name="quarter")
    fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(age_group=["Y015_049"], indicator=["plhiv"],
                                                                    area_level=["0"]), name="age group")
    fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(sex=["female"], indicator=["plhiv"],
                                                                    area_level=["0"]), name="sex")
    fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(area_id=["MWI"], indicator=["plhiv"]), name="area id")
    fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(indicator=["plhiv"], area_level=["1", "2"]),
           name="two area levels")


def test_filtered_data_combined_and_everything(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    cid = pipeline.calibrate_id
    fd(a, f"/calibrate/result/filteredData/{cid}",
           json=all_filter(indicator=["prevalence"], calendar_quarter=["CY2020Q3"], age_group=["Y015_049"],
                           sex=["both"], area_id=["MWI"], area_level=["0"]), name="all six filters")
    fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(indicator=["prevalence"]),
           name="indicator only: every area level, quarter, age and sex")


def test_filtered_data_empty_lists_and_no_matches(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    cid = pipeline.calibrate_id
    for key in ("indicator", "calendar_quarter", "age_group", "sex", "area_id", "area_level"):
        fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(**{key: []}), name=f"empty list for {key}")
    fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(indicator=["not_an_indicator"]), name="unknown indicator")
    fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(indicator=["prevalence"], area_id=["NOWHERE"]),
           name="unknown area")
    fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(indicator=["prevalence"], sex=["female"], area_level=["99"]),
           name="no rows match")


def test_filtered_data_bad_requests(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    cid = pipeline.calibrate_id
    fd(a, f"/calibrate/result/filteredData/{cid}", name="no body")
    fd(a, f"/calibrate/result/filteredData/{cid}", json={"indicator": ["prevalence"]}, name="missing keys")
    fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(area_level=["x"]), name="non numeric area level")
    fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(area_level=[0]), name="numeric area level")
    fd(a, f"/calibrate/result/filteredData/{cid}", json=all_filter(indicator="prevalence"), name="string not list")
    fd(a, f"/calibrate/result/filteredData/{cid}", content_type="application/json", raw_body=b"{no", name="malformed")
    fd(a, "/calibrate/result/filteredData/nonsense", json=all_filter(), name="unknown id")
    fd(a, f"/calibrate/result/filteredData/{pipeline.error_calibrate_id}", json=all_filter(), name="failed calibration id")
    a.get(f"/calibrate/result/filteredData/{cid}", name="wrong method")


def test_filtered_data_as_guest(scn, pipeline):
    pipeline.bind(scn)
    fd(scn.client("G"), f"/calibrate/result/filteredData/{pipeline.calibrate_id}",
       json=all_filter(indicator=["prevalence"], area_level=["0"]), name="guest")


# ---------------------------------------------------------------------------------------- data/{id}/{indicator}
def test_calibrate_result_data_by_indicator(scn, pipeline):
    pipeline.bind(scn)
    a = login_and_open(scn)
    cid = pipeline.calibrate_id
    dd(a, f"/calibrate/result/data/{cid}/prevalence", name="one indicator")
    dd(a, f"/calibrate/result/data/{cid}/all", name="all indicators")
    dd(a, f"/calibrate/result/data/{cid}/not_an_indicator", name="unknown indicator gives empty list")
    dd(a, "/calibrate/result/data/nonsense/all", name="unknown id")
    dd(a, f"/calibrate/result/data/{pipeline.error_calibrate_id}/all", name="failed calibration")
