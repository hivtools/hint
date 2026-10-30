"""The endpoints that pass a call on to hintr and need no files and no version (app/routers/hintr_forwards.py).

What the client does with hintr's answer is tested in tests/clients/test_hintr_client.py.
"""

import re

import pytest

from app.routers.hintr_forwards import FORWARDS
from tests.hintr import HINTR_FAILURE, SUCCESS, failure

# (method and path of the hint endpoint, method and path of the call to hintr)
ENDPOINTS = {
    "version": (("GET", "/meta/hintr/version"), ("GET", "/hintr/version")),
    "adr metadata": (("GET", "/meta/adr/t1"), ("GET", "/meta/adr/t1")),
    "model status": (("GET", "/model/status/t1"), ("GET", "/model/status/t1")),
    "model result": (("GET", "/model/result/t1"), ("GET", "/model/result/t1")),
    "model cancel": (("POST", "/model/cancel/t1"), ("POST", "/model/cancel/t1")),
    "comparison plot": (("GET", "/model/comparison/plot/t1"), ("GET", "/comparison/plot/t1")),
    "calibrate options": (("GET", "/calibrate/options/MWI"), ("POST", "/calibrate/options/MWI")),
    "calibrate status": (("GET", "/calibrate/status/t1"), ("GET", "/calibrate/status/t1")),
    "calibrate metadata": (("GET", "/calibrate/result/metadata/t1"), ("GET", "/calibrate/result/metadata/t1")),
    "calibrate plot": (("GET", "/calibrate/plot/t1"), ("GET", "/calibrate/plot/t1")),
    "download status": (("GET", "/download/status/t1"), ("GET", "/download/status/t1")),
}


@pytest.mark.parametrize(("hint_call", "hintr_call"), ENDPOINTS.values(), ids=ENDPOINTS.keys())
async def test_the_call_is_passed_to_hintr_and_the_answer_comes_back_as_it_is(
    anonymous_client, hintr, hint_call, hintr_call
):
    r = await anonymous_client.request(*hint_call)

    assert [(c.method, c.url.path) for c in hintr.calls] == [hintr_call]
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/json"
    assert r.content == SUCCESS


@pytest.mark.parametrize(("hint_call", "hintr_call"), ENDPOINTS.values(), ids=ENDPOINTS.keys())
async def test_no_identity_or_version_is_needed(anonymous_client, hintr, hint_call, hintr_call):
    # Guests may use these, and there are no X-Hint-User or X-Version-Id headers on the request
    assert (await anonymous_client.request(*hint_call)).status_code == 200


@pytest.mark.parametrize("language", ["fr", "pt", "de", "fr-FR,fr;q=0.9,en;q=0.8"])
async def test_the_language_of_the_request_is_passed_to_hintr_as_it_is(anonymous_client, hintr, language):
    await anonymous_client.get("/meta/hintr/version", headers={"Accept-Language": language})
    assert hintr.calls[0].headers["Accept-Language"] == language


async def test_the_language_is_english_without_a_header(anonymous_client, hintr):
    await anonymous_client.get("/meta/hintr/version")
    assert hintr.calls[0].headers["Accept-Language"] == "en"


async def test_the_id_in_the_url_reaches_hintr_without_changing_the_path(anonymous_client, hintr):
    await anonymous_client.get("/model/status/a%3Fb%23c%20d")
    assert hintr.calls[0].url.raw_path == b"/model/status/a%3Fb%23c%20d"


async def test_what_the_client_makes_of_hintrs_answer_is_what_comes_back(anonymous_client, hintr):
    hintr.answer(503, content=b"Service Unavailable", headers={"Content-Type": "text/plain"})
    r = await anonymous_client.get("/model/status/t1")
    assert r.status_code == 500
    assert r.json() == failure("Could not parse response.")

    hintr.answer(404, json=HINTR_FAILURE)
    r = await anonymous_client.get("/model/status/t1")
    assert r.status_code == 404
    assert r.json() == HINTR_FAILURE


async def test_the_api_docs_show_the_path_parameters_and_the_call_that_is_passed_on(anonymous_client):
    docs = (await anonymous_client.get("/openapi.json")).json()["paths"]

    status = docs["/model/status/{task_id}"]["get"]
    assert status["summary"] == "Passed on to hintr: GET /model/status/{task_id}"
    assert [(p["name"], p["in"], p["required"]) for p in status["parameters"]] == [
        ("task_id", "path", True),
        ("accept-language", "header", False),
    ]
    options = docs["/calibrate/options/{iso3}"]["get"]
    assert options["summary"] == "Passed on to hintr: POST /calibrate/options/{iso3}"
    assert options["parameters"][0]["name"] == "iso3"
    assert [p["name"] for p in docs["/meta/hintr/version"]["get"]["parameters"]] == ["accept-language"]


def test_every_endpoint_in_the_tests_is_in_the_table_and_the_other_way_round():
    in_the_table = {(f.method, f.path) for f in FORWARDS}
    in_the_tests = {hint_call for hint_call, _ in ENDPOINTS.values()}
    # The tests use an example id, the table has the name of the path parameter
    normalised = {(m, re.sub(r"/(t1|MWI)$", "/{x}", p)) for m, p in in_the_tests}
    assert {(m, re.sub(r"/\{\w+\}$", "/{x}", p)) for m, p in in_the_table} == normalised
