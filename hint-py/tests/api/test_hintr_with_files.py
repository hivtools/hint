"""The endpoints that add the files of the version to a call to hintr: the review inputs charts, the model options, the
fit and the downloads (app/routers/review_inputs.py, model.py and downloads.py).

What the client does with hintr's answer is tested in tests/clients/test_hintr_client.py.
"""

import json
from typing import Any

import pytest

from app import schemas
from app.db.database import create_db_session_factory
from app.db.models import File
from app.db.version_repository import VersionRepository
from tests.api.helpers import add_files, hintr_file, make_client
from tests.hintr import HINTR_FAILURE, SUCCESS, failure
from tests.support import OTHER_USER

OPTIONS = {"options": {"area_level": "4"}, "version": {"hintr": "1", "naomi": "2"}, "iso3": "MWI"}
ALL_MODEL_FILES = ["anc", "pjnz", "population", "programme", "shape", "survey"]


def sent_to_hintr(hintr) -> list[tuple[str, str, Any]]:
    """(method, path, body) of each call, the body being None if there was none."""
    return [(c.method, c.url.path, json.loads(c.content) if c.content else None) for c in hintr.calls]


# ---- Whatever the endpoint


ENDPOINTS = {
    "input time series": ("GET", "/chart-data/input-time-series/anc", None),
    "input comparison": ("GET", "/chart-data/input-comparison", None),
    "input population": ("GET", "/chart-data/input-population", None),
    "review inputs": ("POST", "/meta/review-inputs/MWI", {"types": ["anc"]}),
    "model options": ("GET", "/model/options", None),
    "validate options": ("POST", "/model/validate/options", OPTIONS),
    "run": ("POST", "/model/run", OPTIONS),
    "download": ("POST", "/download/submit/summary/t1", {"iso3": "MWI"}),
}


@pytest.mark.parametrize(("method", "path", "body"), ENDPOINTS.values(), ids=ENDPOINTS.keys())
async def test_hintrs_answer_comes_back_as_it_is(on_a_version, hintr, method, path, body):
    r = await on_a_version.request(method, path, json=body)
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/json"
    assert r.content == SUCCESS


@pytest.mark.parametrize(("method", "path", "body"), ENDPOINTS.values(), ids=ENDPOINTS.keys())
async def test_a_failure_of_hintr_comes_back(on_a_version, hintr, method, path, body):
    hintr.answer(400, json=HINTR_FAILURE)
    r = await on_a_version.request(method, path, json=body)
    assert r.status_code == 400
    assert r.json() == HINTR_FAILURE


@pytest.mark.parametrize(("method", "path", "body"), ENDPOINTS.values(), ids=ENDPOINTS.keys())
async def test_the_language_of_the_request_goes_to_hintr(on_a_version, hintr, method, path, body):
    await on_a_version.request(method, path, json=body, headers={"Accept-Language": "fr"})
    assert hintr.calls[0].headers["Accept-Language"] == "fr"


@pytest.mark.parametrize(("method", "path", "body"), ENDPOINTS.values(), ids=ENDPOINTS.keys())
async def test_hintr_is_not_called_for_a_version_the_user_may_not_use(api, hintr, version_id, method, path, body):
    async with make_client(OTHER_USER, version_id) as someone_else:
        r = await someone_else.request(method, path, json=body)
    assert r.status_code == 403
    assert r.json()["errors"][0]["error"] == "INVALID_VERSION"
    assert hintr.calls == []


@pytest.mark.parametrize(("method", "path", "body"), ENDPOINTS.values(), ids=ENDPOINTS.keys())
async def test_hintr_is_not_called_without_a_version(api, hintr, method, path, body):
    r = await api.request(method, path, json=body)
    assert r.status_code == 403
    assert r.json()["errors"][0]["error"] == "INVALID_VERSION"
    assert hintr.calls == []


async def test_a_guest_may_use_the_versions_the_server_gave_them(api, hintr):
    async with make_client("guest", "g1") as guest:
        guest.headers["X-Hint-Guest-Versions"] = "g1,g2"
        r = await guest.get("/model/options")
    # g1 is allowed, but it is not a version in the database, so it has no files
    assert r.status_code == 200
    assert sent_to_hintr(hintr) == [("POST", "/model/options", {})]


async def test_a_guest_may_not_use_any_other_version(api, hintr):
    async with make_client("guest", "g3") as guest:
        guest.headers["X-Hint-Guest-Versions"] = "g1,g2"
        r = await guest.get("/model/options")
    assert r.status_code == 403
    assert hintr.calls == []


# ---- Charts of the inputs


async def test_the_time_series_of_anc_is_drawn_from_the_anc_and_shape_files(on_a_version, hintr, engine, version_id):
    await add_files(engine, version_id, "anc", "shape", "pjnz", "programme")
    await on_a_version.get("/chart-data/input-time-series/anc")
    assert sent_to_hintr(hintr) == [
        (
            "POST",
            "/chart-data/input-time-series/anc",
            {"data": {"anc": hintr_file("anc"), "shape": hintr_file("shape")}},
        )
    ]


async def test_the_time_series_of_programme_is_drawn_from_the_programme_shape_and_pjnz_files(
    on_a_version, hintr, engine, version_id
):
    await add_files(engine, version_id, "anc", "shape", "pjnz", "programme")
    await on_a_version.get("/chart-data/input-time-series/programme")
    assert sent_to_hintr(hintr) == [
        (
            "POST",
            "/chart-data/input-time-series/programme",
            {"data": {"programme": hintr_file("programme"), "shape": hintr_file("shape"), "pjnz": hintr_file("pjnz")}},
        )
    ]


async def test_the_files_that_the_version_does_not_have_are_left_out(on_a_version, hintr, engine, version_id):
    await add_files(engine, version_id, "anc")
    await on_a_version.get("/chart-data/input-time-series/anc")
    assert sent_to_hintr(hintr)[0][2] == {"data": {"anc": hintr_file("anc")}}


async def test_the_type_of_the_time_series_can_be_in_any_case(on_a_version, hintr):
    await on_a_version.get("/chart-data/input-time-series/ANC")
    # hintr is asked for the lower case type
    assert hintr.calls[0].url.path == "/chart-data/input-time-series/anc"


@pytest.mark.parametrize("series_type", ["survey", "pjnz", "bogus", "not-a-real-type"])
async def test_other_types_of_time_series_are_refused_before_hintr_is_called(on_a_version, hintr, series_type):
    r = await on_a_version.get(f"/chart-data/input-time-series/{series_type}")
    assert r.status_code == 400
    assert r.json() == failure("Unknown input time series type.")
    assert hintr.calls == []


async def test_the_refusal_of_a_time_series_type_is_translated(on_a_version):
    r = await on_a_version.get("/chart-data/input-time-series/bogus", headers={"Accept-Language": "fr"})
    assert r.json()["errors"][0]["detail"] == "Type de série temporelle d'entrée inconnu"


async def test_an_unknown_time_series_type_is_refused_with_no_version_first(api):
    # The version is checked before anything else about the request
    r = await api.get("/chart-data/input-time-series/bogus")
    assert r.status_code == 403


async def test_the_comparison_is_drawn_from_four_files_which_are_the_body_itself(
    on_a_version, hintr, engine, version_id
):
    await add_files(engine, version_id, "shape", "pjnz", "anc", "programme", "survey", "population")
    await on_a_version.get("/chart-data/input-comparison")
    assert sent_to_hintr(hintr) == [
        (
            "POST",
            "/chart-data/input-comparison",
            {name: hintr_file(name) for name in ("shape", "pjnz", "anc", "programme")},
        )
    ]


async def test_the_population_chart_is_drawn_from_the_population_file(on_a_version, hintr, engine, version_id):
    await add_files(engine, version_id, "shape", "population")
    await on_a_version.get("/chart-data/input-population")
    assert sent_to_hintr(hintr) == [("POST", "/chart-data/input-population", {"population": hintr_file("population")})]


async def test_a_version_with_no_files_sends_an_empty_body_not_no_body(on_a_version, hintr):
    await on_a_version.get("/chart-data/input-population")
    assert hintr.calls[0].content == b"{}"


async def test_a_file_from_adr_says_so_and_where_from(on_a_version, hintr, engine, version_id):
    async with create_db_session_factory(engine)() as db_session, db_session.begin():
        db_session.add(File(hash="h1"))
        await db_session.flush()
        await VersionRepository(db_session).set_files_for_version(
            version_id,
            {
                "population": schemas.VersionFile(
                    hash="h1", filename="pop.csv", from_adr=True, resource_url="http://adr/x"
                )
            },
        )
    await on_a_version.get("/chart-data/input-population")
    assert sent_to_hintr(hintr)[0][2] == {
        "population": {
            "path": "uploads/h1",
            "hash": "h1",
            "filename": "pop.csv",
            "fromADR": True,
            "resource_url": "http://adr/x",
        }
    }


# ---- Metadata of the review inputs


async def test_the_metadata_is_asked_for_the_files_of_the_types_that_were_asked_for(
    on_a_version, hintr, engine, version_id
):
    await add_files(engine, version_id, "anc", "programme", "survey", "shape")
    r = await on_a_version.post("/meta/review-inputs/MWI", json={"types": ["anc", "shape"]})
    assert r.status_code == 200
    assert sent_to_hintr(hintr) == [
        (
            "POST",
            "/review-input/metadata",
            {"data": {"anc": hintr_file("anc"), "shape": hintr_file("shape")}, "iso3": "MWI"},
        )
    ]


async def test_a_type_with_no_file_is_sent_as_null(on_a_version, hintr, engine, version_id):
    await add_files(engine, version_id, "shape")
    await on_a_version.post("/meta/review-inputs/MWI", json={"types": ["anc", "shape"]})
    assert sent_to_hintr(hintr)[0][2]["data"] == {"anc": None, "shape": hintr_file("shape")}


async def test_the_types_are_sent_as_they_were_written(on_a_version, hintr, engine, version_id):
    await add_files(engine, version_id, "anc", "survey")
    await on_a_version.post("/meta/review-inputs/MWI", json={"types": ["ANC", "Survey"]})
    assert sent_to_hintr(hintr)[0][2]["data"] == {"ANC": hintr_file("anc"), "Survey": hintr_file("survey")}


async def test_no_types_is_no_files(on_a_version, hintr):
    await on_a_version.post("/meta/review-inputs/MWI", json={"types": []})
    assert sent_to_hintr(hintr) == [("POST", "/review-input/metadata", {"data": {}, "iso3": "MWI"})]


@pytest.mark.parametrize("types", [["population"], ["pjnz"], ["anc", "bogus"], ["vmmc"]])
async def test_other_types_are_refused_before_hintr_is_called(on_a_version, hintr, types):
    r = await on_a_version.post("/meta/review-inputs/MWI", json={"types": types})
    assert r.status_code == 400
    assert r.json() == failure("Unknown review input plot file type.")
    assert hintr.calls == []


async def test_the_refusal_of_a_review_type_is_translated(on_a_version):
    r = await on_a_version.post("/meta/review-inputs/MWI", json={"types": ["bogus"]}, headers={"Accept-Language": "fr"})
    assert r.json()["errors"][0]["detail"] == "Type de fichier de tracé d'entrée de révision inconnu."


@pytest.mark.parametrize("body", [{}, {"types": "anc"}, {"types": [1]}])
async def test_a_body_with_no_list_of_types_is_an_unexpected_error(on_a_version, hintr, body):
    r = await on_a_version.post("/meta/review-inputs/MWI", json=body)
    assert r.status_code == 400
    assert "unexpected error" in r.json()["errors"][0]["detail"]
    assert hintr.calls == []


async def test_a_review_inputs_request_with_no_body_is_an_unexpected_error(on_a_version, hintr):
    r = await on_a_version.post("/meta/review-inputs/MWI")
    assert r.status_code == 400
    assert hintr.calls == []


async def test_the_iso3_goes_in_the_body_so_it_cannot_change_the_path_of_the_call(on_a_version, hintr):
    await on_a_version.post("/meta/review-inputs/a%3Fb%23c%20d", json={"types": []})
    assert sent_to_hintr(hintr) == [("POST", "/review-input/metadata", {"data": {}, "iso3": "a?b#c d"})]


# ---- Model options, validating and running


async def test_the_form_of_the_options_is_made_from_four_files(on_a_version, hintr, engine, version_id):
    await add_files(engine, version_id, *ALL_MODEL_FILES, "vmmc")
    await on_a_version.get("/model/options")
    assert sent_to_hintr(hintr) == [
        ("POST", "/model/options", {name: hintr_file(name) for name in ("shape", "survey", "programme", "anc")})
    ]


async def test_validating_the_options_sends_them_with_the_files_of_the_model(on_a_version, hintr, engine, version_id):
    await add_files(engine, version_id, *ALL_MODEL_FILES, "vmmc")
    r = await on_a_version.post("/model/validate/options", json=OPTIONS)
    assert r.status_code == 200
    assert sent_to_hintr(hintr) == [
        (
            "POST",
            "/validate/options",
            {"options": {"area_level": "4"}, "data": {name: hintr_file(name) for name in ALL_MODEL_FILES}},
        )
    ]


async def test_running_the_model_sends_the_options_the_version_the_country_and_the_files(
    on_a_version, hintr, engine, version_id
):
    await add_files(engine, version_id, *ALL_MODEL_FILES, "vmmc")
    r = await on_a_version.post("/model/run", json=OPTIONS)
    assert r.status_code == 200
    assert sent_to_hintr(hintr) == [
        (
            "POST",
            "/model/submit",
            {
                "options": {"area_level": "4"},
                "version": {"hintr": "1", "naomi": "2"},
                "iso3": "MWI",
                "data": {name: hintr_file(name) for name in ALL_MODEL_FILES},
            },
        )
    ]


async def test_a_model_may_be_run_without_files(on_a_version, hintr):
    await on_a_version.post("/model/run", json=OPTIONS)
    assert sent_to_hintr(hintr)[0][2]["data"] == {}


async def test_the_options_are_sent_as_they_are(on_a_version, hintr):
    options = {"a": 1, "b": "text", "c": True, "d": None, "e": [1, 2], "f": {"g": 1.5}}
    await on_a_version.post("/model/run", json={**OPTIONS, "options": options})
    assert sent_to_hintr(hintr)[0][2]["options"] == options


async def test_the_iso3_may_be_missing_and_is_then_null(on_a_version, hintr):
    await on_a_version.post("/model/run", json={"options": {}, "version": {}})
    assert sent_to_hintr(hintr)[0][2]["iso3"] is None


async def test_a_number_for_the_iso3_is_text(on_a_version, hintr):
    await on_a_version.post("/model/run", json={**OPTIONS, "iso3": 5})
    assert sent_to_hintr(hintr)[0][2]["iso3"] == "5"


@pytest.mark.parametrize("path", ["/model/validate/options", "/model/run", "/calibrate/submit/t1"])
@pytest.mark.parametrize(
    "body",
    [
        None,
        {},
        {"foo": 1},
        {"options": {}},
        {"version": {}},
        {"options": "text", "version": {}},
        {"options": {}, "version": []},
    ],
    ids=[
        "no body",
        "empty",
        "wrong fields",
        "no version",
        "no options",
        "options not an object",
        "version not an object",
    ],
)
async def test_a_body_that_is_not_the_options_is_an_unexpected_error(on_a_version, hintr, path, body):
    r = await on_a_version.post(path, json=body)
    assert r.status_code == 400
    assert "unexpected error" in r.json()["errors"][0]["detail"]
    assert hintr.calls == []


@pytest.mark.parametrize("path", ["/model/validate/options", "/model/run", "/calibrate/submit/t1"])
async def test_malformed_json_is_an_unexpected_error(on_a_version, hintr, path):
    r = await on_a_version.post(path, content=b"{nope", headers={"Content-Type": "application/json"})
    assert r.status_code == 400
    assert hintr.calls == []


# ---- Calibrating


async def test_a_calibration_is_sent_with_the_options_and_no_files(on_a_version, hintr, engine, version_id):
    await add_files(engine, version_id, *ALL_MODEL_FILES)
    r = await on_a_version.post("/calibrate/submit/fit1", json=OPTIONS)
    assert r.status_code == 200
    assert sent_to_hintr(hintr) == [
        (
            "POST",
            "/calibrate/submit/fit1",
            {"options": {"area_level": "4"}, "version": {"hintr": "1", "naomi": "2"}, "iso3": "MWI"},
        )
    ]


async def test_a_calibration_needs_no_version(anonymous_client, hintr):
    # It is of a fit that hintr already has, it does not use the version's files
    r = await anonymous_client.post("/calibrate/submit/fit1", json=OPTIONS)
    assert r.status_code == 200


async def test_the_id_of_the_fit_cannot_change_the_path_of_the_call(anonymous_client, hintr):
    await anonymous_client.post("/calibrate/submit/a%3Fb%23c%20d", json=OPTIONS)
    assert hintr.calls[0].url.raw_path == b"/calibrate/submit/a%3Fb%23c%20d"


# ---- Downloads

PAYLOAD = {"iso3": "MWI", "state": {"step": 3}, "notes": {"project_notes": {"note": "x"}}}


async def test_a_download_of_a_type_with_no_extra_file_is_sent_as_it_is(on_a_version, hintr, engine, version_id):
    await add_files(engine, version_id, "pjnz", "vmmc")
    for download_type in ("summary", "comparison", "coarse-output", "coarse_output", "bogus"):
        await on_a_version.post(f"/download/submit/{download_type}/c1", json=PAYLOAD)
    assert sent_to_hintr(hintr) == [
        ("POST", f"/download/submit/{t}/c1", PAYLOAD)
        for t in ("summary", "comparison", "coarse-output", "coarse_output", "bogus")
    ]


@pytest.mark.parametrize("download_type", ["spectrum", "datapack"])
async def test_a_spectrum_or_datapack_download_has_the_vmmc_file_when_there_is_one(
    on_a_version, hintr, engine, version_id, download_type
):
    await add_files(engine, version_id, "pjnz", "vmmc")
    await on_a_version.post(f"/download/submit/{download_type}/c1", json=PAYLOAD)
    assert sent_to_hintr(hintr) == [
        ("POST", f"/download/submit/{download_type}/c1", {**PAYLOAD, "vmmc": hintr_file("vmmc")})
    ]


@pytest.mark.parametrize("download_type", ["spectrum", "datapack"])
async def test_a_spectrum_or_datapack_download_has_no_vmmc_when_there_is_none(
    on_a_version, hintr, engine, version_id, download_type
):
    await add_files(engine, version_id, "pjnz")
    await on_a_version.post(f"/download/submit/{download_type}/c1", json=PAYLOAD)
    assert sent_to_hintr(hintr) == [("POST", f"/download/submit/{download_type}/c1", PAYLOAD)]


async def test_an_agyw_download_has_the_pjnz_file(on_a_version, hintr, engine, version_id):
    await add_files(engine, version_id, "pjnz", "vmmc")
    await on_a_version.post("/download/submit/agyw/c1", json=PAYLOAD)
    assert sent_to_hintr(hintr) == [("POST", "/download/submit/agyw/c1", {**PAYLOAD, "pjnz": hintr_file("pjnz")})]


async def test_an_agyw_download_has_null_for_the_pjnz_when_there_is_none(on_a_version, hintr):
    await on_a_version.post("/download/submit/agyw/c1", json=PAYLOAD)
    assert sent_to_hintr(hintr) == [("POST", "/download/submit/agyw/c1", {**PAYLOAD, "pjnz": None})]


async def test_the_files_in_the_body_are_replaced_by_the_ones_of_the_version(on_a_version, hintr, engine, version_id):
    # The browser cannot choose which file hintr reads
    await add_files(engine, version_id, "pjnz")
    await on_a_version.post("/download/submit/agyw/c1", json={**PAYLOAD, "pjnz": {"path": "/etc/passwd"}})
    assert sent_to_hintr(hintr)[0][2]["pjnz"] == hintr_file("pjnz")


@pytest.mark.parametrize("body", [None, {}])
async def test_a_download_with_no_payload_is_sent_with_no_body(on_a_version, hintr, body):
    await on_a_version.post("/download/submit/summary/c1", json=body)
    assert sent_to_hintr(hintr) == [("POST", "/download/submit/summary/c1", None)]


@pytest.mark.parametrize("download_type", ["agyw", "spectrum", "datapack", "summary", "comparison", "coarse-output"])
async def test_every_type_of_download_needs_a_version(api, hintr, download_type):
    # Even the ones that add no file, so that all of the downloads are checked in the same way
    r = await api.post(f"/download/submit/{download_type}/c1", json=PAYLOAD)
    assert r.status_code == 403
    assert hintr.calls == []


async def test_a_download_with_a_payload_that_is_not_an_object_is_an_unexpected_error(on_a_version, hintr):
    r = await on_a_version.post("/download/submit/summary/c1", json=[1, 2])
    assert r.status_code == 400
    assert hintr.calls == []


async def test_the_ids_of_a_download_cannot_change_the_path_of_the_call(on_a_version, hintr):
    await on_a_version.post("/download/submit/a%3Fb/c%23d", json=PAYLOAD)
    assert hintr.calls[0].url.raw_path == b"/download/submit/a%3Fb/c%23d"


async def test_the_api_docs_show_the_path_parameters(anonymous_client):
    docs = (await anonymous_client.get("/openapi.json")).json()["paths"]
    parameters = docs["/download/submit/{download_type}/{task_id}"]["post"]["parameters"]
    assert [(p["name"], p["in"]) for p in parameters if p["in"] == "path"] == [
        ("download_type", "path"),
        ("task_id", "path"),
    ]
