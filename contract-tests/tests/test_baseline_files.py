"""Baseline inputs: PJNZ, shape, population (+ combined validation).  Success and every distinct failure."""
from __future__ import annotations

import pytest

from hintcontract.flows import login_and_open, guest_open, upload
from hintcontract.scenario import Upload

KINDS = {"pjnz": "/baseline/pjnz", "shape": "/baseline/shape", "population": "/baseline/population"}
GOOD = {"pjnz": "Malawi2024.PJNZ", "shape": "malawi.geojson", "population": "population.csv"}


@pytest.mark.parametrize("kind", ["pjnz", "shape", "population"])
@pytest.mark.parametrize("user", ["guest", "user"])
def test_upload_get_delete_cycle(scn, kind, user):
    a = login_and_open(scn) if user == "user" else guest_open(scn)
    a.get(KINDS[kind], name="get before upload is null")
    r = upload(a, kind)
    assert r.status == 200
    a.get(KINDS[kind], name="get after upload re-validates the file")
    scn.db_rows("version_file")
    scn.db_rows("file")
    scn.uploads()
    a.delete(KINDS[kind], name="delete")
    a.get(KINDS[kind], name="get after delete is null")
    a.delete(KINDS[kind], name="delete again is still a success")
    scn.db_rows("version_file")
    scn.uploads("file stays on disk after delete")


def test_pjnz_zip_upload_is_accepted(scn):
    a = login_and_open(scn)
    upload(a, "pjnz", "Botswana2018.zip")
    scn.uploads()


def test_pjnz_other_country_and_lowercase_extension(scn):
    a = login_and_open(scn)
    upload(a, "pjnz", "Botswana2018.PJNZ")
    a.post("/baseline/pjnz", files={"file": Upload("renamed.pjnz", open(scn.env.fixtures_dir / "Malawi2024.PJNZ", "rb").read())},
           name="lowercase extension")
    scn.uploads()


def test_pjnz_errors(scn):
    a = login_and_open(scn)
    cases = {
        "geojson instead of pjnz": "malawi.geojson",
        "csv instead of pjnz": "anc.csv",
        "xlsx instead of pjnz": "vmmc.xlsx",
        "zip without any pjnz": "output.zip",
        "empty file": Upload("empty.PJNZ", b""),
        "garbage bytes named .PJNZ": Upload("garbage.PJNZ", b"\x00\x01 garbage"),
        "no extension at all": Upload("README", b"abc"),
        "only an extension": Upload(".PJNZ", b"abc"),
    }
    for label, spec in cases.items():
        a.post("/baseline/pjnz", files={"file": spec}, name=f"pjnz: {label}")
    scn.uploads()


def test_shape_errors(scn):
    a = login_and_open(scn)
    cases = {
        "pjnz instead of geojson": "Malawi2024.PJNZ",
        "csv instead of geojson": "population.csv",
        "zip instead of geojson": "Botswana2018.zip",
        "geojson with missing regions": "malawi_missing_regions.geojson",
        "empty file": Upload("empty.geojson", b""),
        "not json": Upload("bad.geojson", b"{not json"),
        "json but not geojson": Upload("other.geojson", b'{"a": 1}'),
        "no extension": Upload("shapefile", b"{}"),
    }
    for label, spec in cases.items():
        a.post("/baseline/shape", files={"file": spec}, name=f"shape: {label}")


def test_population_errors(scn):
    a = login_and_open(scn)
    cases = {
        "pjnz instead of csv": "Malawi2024.PJNZ",
        "geojson instead of csv": "malawi.geojson",
        "anc file (wrong columns)": "anc.csv",
        "survey file (wrong columns)": "survey.csv",
        "programme file (wrong columns)": "programme.csv",
        "file with another country in it": "malformed_anc.csv",
        "empty file": Upload("empty.csv", b""),
        "header only": Upload("header.csv", b"area_id,age_group\n"),
        "binary garbage": Upload("garbage.csv", bytes(range(256))),
    }
    for label, spec in cases.items():
        a.post("/baseline/population", files={"file": spec}, name=f"population: {label}")


@pytest.mark.quirk
@pytest.mark.parametrize("kind", ["pjnz", "shape", "population"])
def test_failed_validation_still_replaces_the_stored_file(scn, kind):
    """quirk: the upload is saved and attached to the version BEFORE hintr validates it, so a rejected file
    replaces the good one; later GETs then fail validation."""
    a = login_and_open(scn)
    upload(a, kind)
    bad = {"pjnz": "malawi.geojson", "shape": "population.csv", "population": "malawi.geojson"}[kind]
    r = a.post(KINDS[kind], files={"file": bad}, name="upload invalid file over good one")
    assert r.status == 400
    a.get(KINDS[kind], name="GET now reports the invalid file")
    scn.db_rows("version_file")
    scn.uploads()


def test_upload_request_errors(scn):
    a = login_and_open(scn)
    a.post("/baseline/pjnz", files={"other": Upload("a.PJNZ", b"abc")}, name="wrong part name")
    a.post("/baseline/pjnz", files={"file": Upload("", b"abc")}, name="empty filename")
    a.post("/baseline/pjnz", name="no body")
    a.post("/baseline/pjnz", form={"file": "text"}, name="file sent as a plain form field")
    a.post("/baseline/pjnz", json={"file": "x"}, name="json body")
    a.get("/baseline/pjnz/upload", name="unknown sub route")
    a.post("/baseline/pjnz/", files={"file": "Malawi2024.PJNZ"}, name="trailing slash")
    a.post("/baseline/pjnz", files={"file": Upload("a.PJNZ", b"abc")}, headers={"Accept-Language": "fr"},
           name="french error text")
    a.post("/baseline/pjnz", files={"file": Upload("a.PJNZ", b"abc")}, headers={"Accept-Language": "pt"},
           name="portuguese error text")


def test_hintr_error_messages_follow_accept_language(scn):
    a = login_and_open(scn)
    for lang in ("en", "fr", "pt", "de", "fr-FR,fr;q=0.9"):
        a.post("/baseline/pjnz", files={"file": "malawi.geojson"}, headers={"Accept-Language": lang},
               name=f"geojson as pjnz, Accept-Language {lang}")


@pytest.mark.quirk
def test_upload_before_opening_app_fails_because_version_row_missing(scn):
    """quirk: a brand new session has no project_version row until GET / (or similar) creates it."""
    a = scn.client("A")
    a.login()
    a.post("/baseline/pjnz", files={"file": "Malawi2024.PJNZ"}, name="upload without opening the app")
    scn.db_rows("file")
    scn.uploads()


# ---------------------------------------------------------------------------------------------------- combined
def test_baseline_combined_validation(scn):
    a = login_and_open(scn)
    a.get("/baseline/validate", name="nothing uploaded")
    upload(a, "pjnz")
    a.get("/baseline/validate", name="only pjnz")
    upload(a, "shape")
    a.get("/baseline/validate", name="pjnz + shape")
    upload(a, "population")
    a.get("/baseline/validate", name="all three, consistent")


def test_baseline_combined_inconsistent_countries(scn):
    a = login_and_open(scn)
    upload(a, "pjnz", "Botswana2018.PJNZ")
    upload(a, "shape")
    a.get("/baseline/validate", name="botswana pjnz + malawi shape")
    a.get("/baseline/validate", headers={"Accept-Language": "fr"}, name="same in french")
    upload(a, "population")
    a.get("/baseline/validate", name="plus population")


def test_baseline_combined_with_an_invalid_file_attached(scn):
    a = login_and_open(scn)
    upload(a, "pjnz")
    a.post("/baseline/shape", files={"file": Upload("bad.geojson", b"{not json")}, name="invalid shape")
    a.get("/baseline/validate", name="combined validation reports the invalid shape")
