"""POST /calibrate/result/filteredData/{id} (app/routers/calibrate_results.py).

How the rows are chosen and written is tested in tests/db/test_calibrate_data_repository.py. These are about hintr's part
(it says where the results database is), where that is, and the request and response.
"""

import json
import logging

import pytest

from tests.hintr import HINTR_FAILURE, failure, success
from tests.results import ROWS, write_results_database

URL = "/calibrate/result/filteredData/t1"
NO_FILTER = {
    "indicator": None,
    "calendar_quarter": None,
    "age_group": None,
    "sex": None,
    "area_id": None,
    "area_level": None,
}


@pytest.fixture
def results(results_dir, hintr):
    """A results database in the results folder, which hintr says is where the results of task t1 are."""
    write_results_database(results_dir / "t1" / "plot_data.duckdb")
    hintr.answer(200, json=success({"path": "t1/plot_data.duckdb"}))
    return results_dir


async def test_the_rows_are_sent_in_the_usual_response(anonymous_client, results):
    r = await anonymous_client.post(URL, json={**NO_FILTER, "indicator": ["plhiv"]})

    assert r.status_code == 200
    assert r.headers["content-type"] == "application/json"
    assert r.json() == {
        "data": [
            {
                "indicator": "plhiv",
                "calendar_quarter": "CY2020Q3",
                "age_group": "Y015_049",
                "sex": "both",
                "area_id": "MWI",
                "mode": 21577142.0,
                "mean": 21577144.0,
                "lower": 21577140.0,
                "upper": 21577146.0,
                "area_level": 0,
            }
        ],
        "errors": [],
        "status": "success",
    }


async def test_no_rows_is_still_a_success(anonymous_client, results):
    r = await anonymous_client.post(URL, json={**NO_FILTER, "indicator": []})
    assert r.status_code == 200
    assert r.json() == {"data": [], "errors": [], "status": "success"}


async def test_no_filters_sends_everything(anonymous_client, results):
    r = await anonymous_client.post(URL, json=NO_FILTER)
    assert len(r.json()["data"]) == len(ROWS)


async def test_a_filter_that_is_left_out_does_not_filter(anonymous_client, results):
    r = await anonymous_client.post(URL, json={"indicator": ["prevalence"]})
    assert r.status_code == 200
    assert len(r.json()["data"]) == 3


@pytest.mark.parametrize("area_level", [["1"], [1]], ids=["text", "number"])
async def test_the_area_level_can_be_text_or_a_number(anonymous_client, results, area_level):
    r = await anonymous_client.post(URL, json={**NO_FILTER, "area_level": area_level})
    assert [row["area_id"] for row in r.json()["data"]] == ["MWI_1"]


async def test_no_identity_or_version_is_needed(anonymous_client, results):
    # Guests use this, and there are no X-Hint-User or X-Version-Id headers on the request
    assert (await anonymous_client.post(URL, json=NO_FILTER)).status_code == 200


async def test_hintr_is_asked_only_where_the_results_are_and_in_the_language_of_the_request(
    anonymous_client, results, hintr
):
    await anonymous_client.post(
        "/calibrate/result/filteredData/a%3Fb", json=NO_FILTER, headers={"Accept-Language": "fr"}
    )

    assert [(c.method, c.url.raw_path, c.content) for c in hintr.calls] == [
        ("GET", b"/calibrate/result/path/a%3Fb", b"")
    ]
    assert hintr.calls[0].headers["Accept-Language"] == "fr"


async def test_a_failure_of_hintr_comes_back_as_it_is(anonymous_client, results, hintr):
    # The task does not exist, or is not a finished calibration
    hintr.answer(400, json=HINTR_FAILURE)

    r = await anonymous_client.post(URL, json=NO_FILTER)

    assert r.status_code == 400
    assert r.json() == HINTR_FAILURE


async def test_no_answer_from_hintr_is_a_failure(anonymous_client, results, hintr):
    hintr.answer(503, content=b"Service Unavailable", headers={"Content-Type": "text/plain"})
    r = await anonymous_client.post(URL, json=NO_FILTER)
    assert r.status_code == 500
    assert r.json() == failure("Could not parse response.")


async def test_results_that_are_not_in_the_folder_are_a_translated_error(anonymous_client, results, hintr, caplog):
    hintr.answer(200, json=success({"path": "t1/gone.duckdb"}))

    with caplog.at_level(logging.ERROR):
        r = await anonymous_client.post(URL, json=NO_FILTER)

    assert r.status_code == 400
    assert r.json()["errors"][0]["detail"].startswith("No calibration output found for this project")
    assert "t1/gone.duckdb" in caplog.text
    assert "task t1" in caplog.text

    r = await anonymous_client.post(URL, json=NO_FILTER, headers={"Accept-Language": "fr"})
    assert r.json()["errors"][0]["detail"].startswith("Aucune sortie de calibration")


async def test_a_path_that_leads_out_of_the_results_folder_is_not_read(anonymous_client, results, hintr, tmp_path):
    write_results_database(tmp_path / "elsewhere.duckdb")
    hintr.answer(200, json=success({"path": "../elsewhere.duckdb"}))

    r = await anonymous_client.post(URL, json=NO_FILTER)

    assert r.status_code == 400
    assert r.json()["errors"][0]["detail"].startswith("No calibration output found")


async def test_a_file_that_is_not_a_results_database_is_an_unexpected_error(anonymous_client, results, hintr):
    (results / "t1" / "plot_data.duckdb").write_bytes(b"not a database")

    r = await anonymous_client.post(URL, json=NO_FILTER)

    assert r.status_code == 500
    assert r.json()["errors"][0]["detail"].startswith("An unexpected error occurred")


@pytest.mark.parametrize(
    "body",
    [
        pytest.param({**NO_FILTER, "area_level": ["x"]}, id="area level that is not a number"),
        pytest.param({**NO_FILTER, "indicator": "prevalence"}, id="text where there should be a list"),
        pytest.param({**NO_FILTER, "sex": [["female"]]}, id="list in the list"),
    ],
)
async def test_a_filter_of_the_wrong_type_is_a_bad_request(anonymous_client, results, hintr, body):
    r = await anonymous_client.post(URL, json=body)
    assert r.status_code == 400
    assert r.json()["errors"][0]["detail"].startswith("An unexpected error occurred")
    assert hintr.calls == []


async def test_no_body_or_a_body_that_is_not_json_is_a_bad_request(anonymous_client, results, hintr):
    assert (await anonymous_client.post(URL)).status_code == 400
    r = await anonymous_client.post(URL, content=b"{no", headers={"Content-Type": "application/json"})
    assert r.status_code == 400
    assert hintr.calls == []


async def test_the_method_must_be_post(anonymous_client, results):
    r = await anonymous_client.get(URL)
    assert r.status_code == 405
    assert r.headers["allow"] == "POST"


async def test_the_body_is_not_read_and_written_again(anonymous_client, results):
    """The rows can be many megabytes, so the JSON that DuckDB wrote is sent as it is."""
    r = await anonymous_client.post(URL, json={**NO_FILTER, "indicator": ["plhiv"]})
    assert r.text.startswith('{"data":[{"indicator":"plhiv","calendar_quarter":"CY2020Q3"')
    assert r.text.endswith('}],"errors":[],"status":"success"}')
    assert json.loads(r.text)["status"] == "success"
