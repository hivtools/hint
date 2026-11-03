"""The hintr client: what it sends, and how what comes back (or does not) is turned into a hint response.

These apply to every call to hintr, whichever endpoint makes it.
"""

import json

import httpx2
import pytest

from app.clients.hintr_client import HintrClient
from tests.hintr import HINTR_FAILURE, SUCCESS, FakeHintr, failure, success


@pytest.fixture
def client(hintr: FakeHintr) -> HintrClient:
    return HintrClient(hintr.http, "en")


def body_of(response) -> object:
    return json.loads(bytes(response.body))


async def test_the_call_is_made_with_the_method_and_path(client, hintr):
    await client.forward("POST", "/calibrate/options/MWI")
    assert [(c.method, c.url.path) for c in hintr.calls] == [("POST", "/calibrate/options/MWI")]


async def test_the_language_of_the_request_goes_to_hintr(hintr):
    await HintrClient(hintr.http, "fr-FR,fr;q=0.9").forward("GET", "/hintr/version")
    assert hintr.calls[0].headers["Accept-Language"] == "fr-FR,fr;q=0.9"


async def test_the_parameters_are_put_in_the_path(client, hintr):
    await client.forward("GET", "/model/status/{task_id}", {"task_id": "abc"})
    assert hintr.calls[0].url.path == "/model/status/abc"


async def test_a_parameter_cannot_change_the_path_or_add_a_query(client, hintr):
    await client.forward("GET", "/model/status/{task_id}", {"task_id": "a?b#c d/e"})
    assert hintr.calls[0].url.raw_path == b"/model/status/a%3Fb%23c%20d%2Fe"


async def test_hintrs_own_answer_comes_back_as_it_is(client):
    r = await client.forward("GET", "/hintr/version")
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/json"
    # The body is hintr's own, not read and written again
    assert r.body == SUCCESS


@pytest.mark.parametrize("hintr_status", [400, 401, 403, 404])
async def test_error_statuses_up_to_404_are_passed_on(client, hintr, hintr_status):
    hintr.answer(hintr_status, json=HINTR_FAILURE)
    r = await client.forward("GET", "/hintr/version")
    assert r.status_code == hintr_status
    assert body_of(r) == HINTR_FAILURE


@pytest.mark.parametrize("hintr_status", [405, 409, 500, 503, 599])
async def test_other_error_statuses_become_500(client, hintr, hintr_status):
    hintr.answer(hintr_status, json=HINTR_FAILURE)
    r = await client.forward("GET", "/hintr/version")
    assert r.status_code == 500
    assert body_of(r) == HINTR_FAILURE


async def test_an_unknown_status_becomes_500(client, hintr):
    hintr.answer(299, json=HINTR_FAILURE)
    assert (await client.forward("GET", "/hintr/version")).status_code == 500


async def test_a_failure_that_hintr_sends_with_a_200_is_passed_on(client, hintr):
    hintr.answer(200, json=HINTR_FAILURE)
    r = await client.forward("GET", "/hintr/version")
    assert r.status_code == 200
    assert body_of(r) == HINTR_FAILURE


# hintr status, content, content type, and what hint answers (status and body)
HINTR_ODDITIES = {
    "plain text 503": (503, b"Service Unavailable", "text/plain", 500, failure("Could not parse response.")),
    "empty 500": (500, b"", "text/plain", 500, failure("Could not parse response.")),
    "200 but not json": (200, b"this is not json", "application/json", 500, failure("Could not parse response.")),
    "200 truncated json": (200, b'{"status": "succ', "application/json", 500, failure("Could not parse response.")),
    "200 not utf-8": (200, b'{"a": "\xff"}', "application/json", 500, failure("Could not parse response.")),
    "html 502": (
        502,
        b"<html><body><h1>502 Bad Gateway</h1></body></html>",
        "text/html",
        500,
        failure("Could not parse response."),
    ),
    "html 504": (
        504,
        b"<html><body><h1>504 Gateway Time-out</h1></body></html>",
        "text/html",
        500,
        failure("Could not parse response."),
    ),
    "200 json without status": (200, b'{"hello": "world"}', "application/json", 200, success({"hello": "world"})),
    "200 json string": (200, b'"just a string"', "application/json", 200, success("just a string")),
    "200 json list": (200, b"[1, 2, 3]", "application/json", 200, success([1, 2, 3])),
    "200 json null": (200, b"null", "application/json", 200, success(None)),
    "500 json object without status": (
        500,
        b'{"message": "oops"}',
        "application/json",
        500,
        failure('{"message": "oops"}'),
    ),
    "500 json string": (500, b'"a string error"', "application/json", 500, failure("a string error")),
    "500 json number": (500, b"42", "application/json", 500, failure("42")),
    "500 json true": (500, b"true", "application/json", 500, failure("true")),
    "500 json null": (500, b"null", "application/json", 500, failure("null")),
    "404 json list": (404, b"[1,  2]", "application/json", 404, failure("[1, 2]")),
}


@pytest.mark.parametrize(
    ("hintr_status", "content", "content_type", "hint_status", "body"),
    HINTR_ODDITIES.values(),
    ids=HINTR_ODDITIES.keys(),
)
async def test_what_hintr_sends_in_another_format_is_made_to_look_like_hintr(
    client, hintr, hintr_status, content, content_type, hint_status, body
):
    hintr.answer(hintr_status, content=content, headers={"Content-Type": content_type})
    r = await client.forward("GET", "/hintr/version")
    assert r.status_code == hint_status
    assert r.headers["content-type"] == "application/json"
    assert body_of(r) == body


@pytest.mark.parametrize(
    "error",
    [
        httpx2.ConnectError("refused"),
        httpx2.ReadTimeout("too slow"),
        httpx2.RemoteProtocolError("closed without a response"),
    ],
    ids=lambda e: type(e).__name__,
)
async def test_no_answer_from_hintr_is_a_500(client, hintr, error):
    hintr.fail_to_connect(error)
    r = await client.forward("GET", "/model/status/t1")
    assert r.status_code == 500
    assert body_of(r) == failure("No response returned. The request may have timed out.")
