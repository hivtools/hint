"""Reusable flows and canned payloads shared by the test modules."""
from __future__ import annotations

import hashlib
import io
import json
import zipfile
from typing import Any

from .scenario import RecordedClient, Scenario, Upload

TEST_USER = "test.user@example.com"
SUPPORT_USER = "naomi-support@imperial.ac.uk"

BASELINE = {"pjnz": ("/baseline/pjnz/", "Malawi2024.PJNZ"),
            "shape": ("/baseline/shape/", "malawi.geojson"),
            "population": ("/baseline/population/", "population.csv")}
DISEASE = {"survey": ("/disease/survey/", "survey.csv"),
           "programme": ("/disease/programme/", "programme.csv"),
           "anc": ("/disease/anc/", "anc.csv"),
           "vmmc": ("/disease/vmmc/", "vmmc.xlsx")}
ALL_UPLOADS = {**BASELINE, **DISEASE}

MODEL_OPTIONS = {
    "anc_art_coverage_year1": "2023", "anc_prevalence_year1": "2023", "anc_prevalence_year2": "2023",
    "area_level": "4", "area_scope": "MWI", "artattend": "false", "artattend_log_gamma_offset": -4,
    "artattend_t2": "true", "calendar_quarter_t1": "CY2020Q3", "calendar_quarter_t2": "CY2023Q4",
    "calendar_quarter_t3": "CY2024Q3", "calendar_quarter_t4": "CY2025Q3", "calendar_quarter_t5": "CY2026Q3",
    "deff_artcov": 1, "deff_prev": 1, "deff_recent": 1, "include_art_t1": "false", "include_art_t2": "false",
    "max_iterations": 250, "no_of_samples": 1000, "permissive": "false", "rng_seed": 28,
    "survey_art_coverage": "DEMO2020PHIA", "survey_prevalence": "DEMO2020PHIA",
    "survey_recently_infected": "DEMO2020PHIA", "output_aware_plhiv": "true", "anc_clients_year2": 2023,
    "anc_clients_year2_num_months": "9",
}
CALIBRATE_OPTIONS = {
    "spectrum_plhiv_calibration_level": "national", "spectrum_plhiv_calibration_strat": "sex_age_coarse",
    "spectrum_artnum_calibration_level": "national", "spectrum_artnum_calibration_strat": "sex_age_coarse",
    "spectrum_infections_calibration_level": "national", "spectrum_infections_calibration_strat": "sex_age_coarse",
    "spectrum_aware_calibration_level": "none", "spectrum_aware_calibration_strat": "sex_age_coarse",
    "calibrate_method": "logistic",
}
GUEST = "guest"


def login_and_open(scn: Scenario, name: str = "A", user: str = TEST_USER, password: str = "password",
                   quiet: bool = False, project: bool = True) -> RecordedClient:
    """Fresh client, logged in as `user`, with the app opened.

    With `project` (the default) the tab also has a project open, as a real one always has before it works on files:
    the project is created quietly and its version is the one the tab sends in X-Version-Id. Pass `project=False` when
    the test is about projects and needs the user to have none."""
    c = scn.client(name)
    if quiet:
        with scn.quiet():
            c.login(user, password)
            c.open_app()
    else:
        c.login(user, password)
        c.open_app()
    if project:
        with scn.quiet():
            c.start_project("Harness project")
    return c


def guest_open(scn: Scenario, name: str = "A", quiet: bool = False) -> RecordedClient:
    """Fresh guest tab with the app opened, and the version the server gives a guest tab when the app starts."""
    c = scn.client(name)
    if quiet:
        with scn.quiet():
            c.open_app()
    else:
        c.open_app()
    with scn.quiet():
        c.start_guest_version()
    return c


def upload(c: RecordedClient, kind: str, fixture: str | None = None, **kw):
    path, default = ALL_UPLOADS[kind]
    return c.post(path, files={"file": fixture or default}, name=kw.pop("name", f"upload {kind}"), **kw)


def upload_minimal(c: RecordedClient, quiet_scn: Scenario | None = None):
    """shape, pjnz, population, survey (what the model needs)."""
    for kind in ("shape", "pjnz", "population", "survey"):
        upload(c, kind)


def upload_all(c: RecordedClient):
    for kind in ("shape", "pjnz", "population", "survey", "programme", "anc", "vmmc"):
        upload(c, kind)


def create_project(c: RecordedClient, name="Project 1", note: str | None = "a note", **kw):
    body = {"name": name}
    if note is not None:
        body["note"] = note
    return c.post("/project", json=body, name=kw.pop("name_", f"create project {name}"), **kw)


def make_zip(members: dict[str, str | bytes]) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for name, data in members.items():
            z.writestr(zipfile.ZipInfo(name, (2020, 1, 1, 0, 0, 0)), data)
    return buf.getvalue()


def md5_upper(data: bytes) -> str:
    return hashlib.md5(data).hexdigest().upper()


def download_payload(fit_id: str, cal_id: str, iso3: str = "MWI", datasets: dict | None = None) -> dict[str, Any]:
    note = {"note": "test notes", "updated": "2022/05/17 12:34:21", "name": "projectName"}
    ds = datasets if datasets is not None else {
        k: {"filename": k, "path": f"uploads/{k}"} for k in ("anc", "pjnz", "population", "programme", "shape", "survey")}
    return {
        "state": {"datasets": ds, "model_fit": {"id": fit_id, "options": {"": ""}},
                  "calibrate": {"id": cal_id, "options": {"": ""}},
                  "version": {"hintr": "1", "naomi": "1", "rrq": "1"}},
        "notes": {"project_notes": note, "version_notes": [note, note]},
        "iso3": iso3,
    }
