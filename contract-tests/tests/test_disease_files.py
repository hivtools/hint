"""Survey, programme, ANC and VMMC inputs: depend on the shape file (and the PJNZ in strict mode)."""
from __future__ import annotations

import pytest

from hintcontract.flows import DISEASE, guest_open, login_and_open, upload
from hintcontract.scenario import Upload

PATHS = {k: v[0] for k, v in DISEASE.items()}
NEEDS_CSV = ["survey", "programme", "anc"]


def with_baseline(scn, user=True):
    a = login_and_open(scn) if user else guest_open(scn)
    with scn.quiet():
        upload(a, "pjnz")
        upload(a, "shape")
    return a


@pytest.mark.parametrize("kind", list(DISEASE))
@pytest.mark.parametrize("user", ["guest", "user"])
def test_upload_get_delete_cycle(scn, kind, user):
    a = with_baseline(scn, user == "user")
    a.get(PATHS[kind], name="get before upload is null")
    r = upload(a, kind)
    assert r.status == 200
    a.get(PATHS[kind], name="get after upload re-validates")
    scn.db_rows("version_file")
    scn.uploads()
    a.delete(PATHS[kind], name="delete")
    a.get(PATHS[kind], name="get after delete is null")
    a.delete(PATHS[kind], name="delete again")
    scn.db_rows("version_file")


@pytest.mark.parametrize("kind", list(DISEASE))
def test_missing_shape_and_pjnz(scn, kind):
    """No shape / no pjnz.  The file is saved before the prerequisite check, so GET afterwards still finds it."""
    a = login_and_open(scn)
    a.post(PATHS[kind], files={"file": DISEASE[kind][1]}, name="no pjnz, no shape, strict")
    a.post(PATHS[kind], files={"file": DISEASE[kind][1]}, params={"strict": "false"}, name="no pjnz, no shape, lax")
    upload(a, "shape", name="upload shape")
    a.post(PATHS[kind], files={"file": DISEASE[kind][1]}, name="shape only, strict")
    a.post(PATHS[kind], files={"file": DISEASE[kind][1]}, params={"strict": "false"}, name="shape only, lax")
    a.get(PATHS[kind], name="GET strict reports missing pjnz")
    a.get(PATHS[kind], params={"strict": "false"}, name="GET lax works")
    a.delete("/baseline/shape", name="remove shape")
    upload(a, "pjnz", name="upload pjnz")
    a.post(PATHS[kind], files={"file": DISEASE[kind][1]}, name="pjnz only, strict")
    a.get(PATHS[kind], params={"strict": "false"}, name="GET lax with pjnz only")
    for lang in ("fr", "pt"):
        a.post(PATHS[kind], files={"file": DISEASE[kind][1]}, headers={"Accept-Language": lang}, name=f"{lang}")
    scn.db_rows("version_file")


def test_strict_parameter_semantics(scn):
    """Only the literal string `false` makes the request lax."""
    a = login_and_open(scn)
    upload(a, "shape")
    upload(a, "pjnz")
    for value in ("false", "False", "true", "bogus", ""):
        a.post(PATHS["anc"], files={"file": "anc.csv"}, params={"strict": value}, name=f"strict={value!r}")
    a.get(PATHS["anc"], params={"strict": "bogus"}, name="GET strict=bogus")
    # hintr is asked with strict=<true|false> on the query string (see the outbound calls recorded)


def test_survey_errors(scn):
    a = with_baseline(scn)
    cases = {
        "csv with wrong columns (anc)": "anc.csv",
        "csv with wrong columns (population)": "population.csv",
        "survey missing columns": "malformed_survey.csv",
        "survey with another country": "malformed_anc.csv",
        "programme file": "programme.csv",
        "xlsx instead of csv": "vmmc.xlsx",
        "pjnz instead of csv": "Malawi2024.PJNZ",
        "empty file": Upload("empty.csv", b""),
        "binary garbage": Upload("garbage.csv", bytes(range(256))),
        "no extension": Upload("survey", b"a,b\n1,2\n"),
    }
    for label, spec in cases.items():
        a.post(PATHS["survey"], files={"file": spec}, name=f"survey: {label}")
        a.post(PATHS["survey"], files={"file": spec}, params={"strict": "false"}, name=f"survey (lax): {label}")


def test_programme_errors(scn):
    a = with_baseline(scn)
    cases = {
        "programme missing columns": "malformed_programme.csv",
        "programme with another country": "malformed_anc.csv",
        "survey file": "survey.csv",
        "population file": "population.csv",
        "anc file": "anc.csv",
        "xlsx instead of csv": "vmmc.xlsx",
        "empty file": Upload("empty.csv", b""),
        "binary garbage": Upload("garbage.csv", bytes(range(256))),
    }
    for label, spec in cases.items():
        a.post(PATHS["programme"], files={"file": spec}, name=f"programme: {label}")


def test_anc_errors(scn):
    a = with_baseline(scn)
    cases = {
        "malformed anc": "malformed_anc.csv",
        "survey file": "survey.csv",
        "programme file": "programme.csv",
        "population file": "population.csv",
        "xlsx instead of csv": "vmmc.xlsx",
        "empty file": Upload("empty.csv", b""),
        "binary garbage": Upload("garbage.csv", bytes(range(256))),
    }
    for label, spec in cases.items():
        a.post(PATHS["anc"], files={"file": spec}, name=f"anc: {label}")


def test_anc_positive_greater_than_total_accepted(scn):
    """The strict check for ancpos > total was removed (see the disabled Kotlin test), so both modes accept it."""
    a = with_baseline(scn)
    a.post(PATHS["anc"], files={"file": "anc-pos-greater-than-total.csv"}, name="strict")
    a.post(PATHS["anc"], files={"file": "anc-pos-greater-than-total.csv"}, params={"strict": "false"}, name="lax")


def test_vmmc_errors(scn):
    a = with_baseline(scn)
    cases = {
        "csv instead of xlsx": "survey.csv",
        "geojson": "malawi.geojson",
        "pjnz": "Malawi2024.PJNZ",
        "empty file": Upload("empty.xlsx", b""),
        "garbage named .xlsx": Upload("garbage.xlsx", b"not a spreadsheet"),
    }
    for label, spec in cases.items():
        a.post(PATHS["vmmc"], files={"file": spec}, name=f"vmmc: {label}")


@pytest.mark.quirk
@pytest.mark.parametrize("kind", NEEDS_CSV)
def test_failed_validation_still_replaces_stored_file(scn, kind):
    """quirk: as for baseline files, a rejected upload replaces the good one in the version."""
    a = with_baseline(scn)
    upload(a, kind)
    a.post(PATHS[kind], files={"file": "malformed_survey.csv" if kind != "survey" else "population.csv"},
           name="invalid upload")
    a.get(PATHS[kind], name="GET reports the invalid file")
    scn.db_rows("version_file")


def test_replacing_a_file_with_a_valid_one(scn):
    a = with_baseline(scn)
    upload(a, "anc")
    upload(a, "anc", "anc-pos-greater-than-total.csv", name="replace with different anc")
    scn.db_rows("version_file")
    scn.uploads()


def test_shape_replaced_after_disease_upload_is_revalidated_on_get(scn):
    a = with_baseline(scn)
    upload(a, "programme")
    a.post("/baseline/shape", files={"file": "malawi_missing_regions.geojson"}, name="replace shape by an invalid one")
    a.get(PATHS["programme"], name="programme GET now fails because the shape is invalid")
    upload(a, "shape", name="restore shape")
    a.get(PATHS["programme"], name="programme GET works again")
