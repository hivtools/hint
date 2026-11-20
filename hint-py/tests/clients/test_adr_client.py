"""The ADR client: who calls ADR, what it sends, and how the answer of ADR (or no answer) becomes an answer of this API.

These tests are true for every call to ADR, whichever endpoint makes it.
"""

import json
import logging
from typing import Any

import httpx2
import pytest
from pydantic import SecretStr

from app.clients.adr_client import AdrClient, adr_answer, adr_authorization, create_adr_http_client
from app.clients.responses import HintResponse
from app.config import Settings
from app.errors import NoAdrCredentialsError
from tests.adr import FakeAdr, ckan_error, ckan_ok
from tests.support import ADR_KEY, ADR_TOKEN

KEY = SecretStr(ADR_KEY)


def failure(status: int, detail: str, code: str = "OTHER_ERROR") -> HintResponse:
    return HintResponse(status, {"data": {}, "errors": [{"error": code, "detail": detail}], "status": "failure"})


def dev_settings(**settings: Any) -> Settings:
    """The settings of a development API. Only a development API can have an API key for ADR."""
    return Settings(environment="development", **settings)


# ------------------------------------------------------------------------------------------------ the credential
def test_a_token_is_sent_as_a_bearer_and_comes_before_the_key():
    authorization = adr_authorization(dev_settings(adr_api_key=ADR_KEY), ADR_TOKEN)

    assert authorization is not None
    assert authorization.get_secret_value() == f"Bearer {ADR_TOKEN}"


def test_without_a_token_the_key_of_the_settings_is_used():
    authorization = adr_authorization(dev_settings(adr_api_key=ADR_KEY), None)

    assert authorization is not None
    assert authorization.get_secret_value() == ADR_KEY


@pytest.mark.parametrize("settings", [Settings(), dev_settings(adr_api_key="")])
def test_without_a_token_or_a_key_there_is_no_credential(settings):
    assert adr_authorization(settings, None) is None


def test_an_empty_token_is_no_token():
    authorization = adr_authorization(dev_settings(adr_api_key=ADR_KEY), "")

    assert authorization is not None
    assert authorization.get_secret_value() == ADR_KEY


def test_the_credential_is_not_in_its_text():
    assert ADR_KEY not in repr(KEY)
    assert ADR_KEY not in str(KEY)


def test_the_settings_do_not_show_the_key():
    assert ADR_KEY not in repr(dev_settings(adr_api_key=ADR_KEY))


# ------------------------------------------------------------------------------------------------ the address
@pytest.mark.parametrize("adr_url", ["https://adr.example", "https://adr.example/", "https://adr.example//"])
def test_the_address_may_or_may_not_end_with_a_slash(adr_url):
    client = create_adr_http_client(Settings(adr_url=adr_url))

    assert str(client.base_url) == "https://adr.example/api/3/action/"


# ------------------------------------------------------------------------------------------------ the call
@pytest.fixture
def client(adr: FakeAdr) -> AdrClient:
    return AdrClient(adr.http, KEY, "en")


async def test_the_call_is_made_to_the_action_of_the_api_with_the_credential(client, adr):
    await client.organisations("read")

    [call] = adr.calls
    assert call.method == "GET"
    assert str(call.url) == "https://adr.example/api/3/action/organization_list_for_user?permission=read"
    assert call.headers["Authorization"] == ADR_KEY


async def test_a_token_is_sent_as_it_is_given(adr):
    await AdrClient(adr.http, SecretStr(f"Bearer {ADR_TOKEN}"), "en").dataset("d")

    assert adr.calls[0].headers["Authorization"] == f"Bearer {ADR_TOKEN}"


async def test_a_parameter_cannot_add_another_one(client, adr):
    await client.dataset("a&release=b#c d")

    assert adr.queries("package_show") == [{"id": "a&release=b#c d"}]


async def test_a_release_is_a_parameter_of_the_dataset(client, adr):
    await client.dataset("d-output-1", release="rel-1")
    await client.dataset("d-output-1")

    assert adr.queries("package_show") == [{"id": "d-output-1", "release": "rel-1"}, {"id": "d-output-1"}]


async def test_the_releases_of_a_dataset_are_asked_for_by_its_id(client, adr):
    answer = await client.releases("d-output-1")

    assert adr.queries("dataset_version_list") == [{"dataset_id": "d-output-1"}]
    assert answer.data == [{"id": "rel-1", "name": "v1"}, {"id": "rel-2", "name": "v2"}]


async def test_a_search_asks_for_the_types_the_limit_and_private_datasets(client, adr):
    answer = await client.search_datasets(["country-estimates-27", "country-estimates-26"], 5, show_inaccessible=True)

    assert adr.queries("package_search") == [
        {"q": "type:(country-estimates-27 OR country-estimates-26)", "rows": "5", "include_private": "true"}
    ]
    assert [dataset["id"] for dataset in answer.data] == [
        "d-input-1",
        "d-input-empty",
        "d-output-1",
        "d-output-old",
        "d-no-zip",
    ]


async def test_a_search_hides_the_inaccessible_datasets_unless_asked_not_to(client, adr):
    await client.search_datasets(["country-estimates-27"], 5, show_inaccessible=False)

    assert adr.queries("package_search")[0]["hide_inaccessible_resources"] == "true"


async def test_a_search_that_fails_is_the_failure(client, adr):
    adr.fail("package_search", ckan_error(500, "boom"))

    assert await client.search_datasets(["country-estimates-27"], 5, show_inaccessible=False) == failure(
        500, "boom", "ADR_ERROR"
    )


async def test_without_a_credential_nothing_is_sent_and_the_reason_is_logged(adr, caplog):
    with pytest.raises(NoAdrCredentialsError):
        await AdrClient(adr.http, None, "en").dataset("d")

    assert adr.calls == []
    assert [r.getMessage() for r in caplog.records if r.levelno == logging.WARNING] == [
        "No credential to call ADR: there is no single sign-on token, and HINT_ADR_API_KEY is not set"
    ]


async def test_a_call_that_gets_no_answer_is_a_failure_and_does_not_log_the_credential(client, adr, caplog):
    adr.fail_to_connect("package_show", httpx2.ConnectError("connection refused"))

    answer = await client.dataset("d")

    assert answer == failure(500, "No response returned. The request may have timed out.")
    assert [r.getMessage() for r in caplog.records if r.levelno == logging.ERROR] == ["No response from ADR"]


async def test_the_failure_is_in_the_language_of_the_request(adr):
    adr.fail_to_connect("package_show", httpx2.ConnectError("connection refused"))

    answer = await AdrClient(adr.http, KEY, "fr").dataset("d")

    assert answer == failure(500, "Aucune réponse reçue. La requête a peut-être expiré.")


# ------------------------------------------------------------------------------------------------ the answer
def test_a_success_of_ckan_is_its_result():
    body = json.dumps({"success": True, "result": [{"id": "a"}], "help": "https://adr.example/help"}).encode()

    assert adr_answer(200, body) == HintResponse(200, {"data": [{"id": "a"}], "errors": [], "status": "success"})


def test_a_success_of_ckan_with_no_result_has_no_data():
    assert adr_answer(200, b'{"success": true}').envelope["data"] is None


@pytest.mark.parametrize("status", [200, 401, 403, 404, 500])
def test_a_failure_of_ckan_is_a_500_with_its_message_whatever_its_status(status):
    body = json.dumps(
        {"success": False, "error": {"message": "Access denied", "__type": "Authorization Error"}}
    ).encode()

    assert adr_answer(status, body) == failure(500, "Access denied", "ADR_ERROR")


@pytest.mark.parametrize("body", [{"success": False}, {"success": False, "error": "Access denied"}])
def test_a_failure_of_ckan_that_does_not_say_why_is_not_made_up(body):
    # The error handler of the app answers this as an unexpected error
    with pytest.raises((KeyError, TypeError)):
        adr_answer(200, json.dumps(body).encode())


def test_an_answer_that_is_in_the_format_of_this_api_is_passed_on():
    body = {"status": "success", "data": {"a": 1}, "errors": []}

    assert adr_answer(200, json.dumps(body).encode()) == HintResponse(200, body)
    assert adr_answer(400, json.dumps(body).encode()).status_code == 400
    assert adr_answer(502, json.dumps(body).encode()).status_code == 500


def test_json_that_is_not_ckans_is_a_success_if_the_status_is():
    assert adr_answer(200, b'{"a": 1}') == HintResponse(200, {"data": {"a": 1}, "errors": [], "status": "success"})
    assert adr_answer(302, b"[1]").status_code == 200


@pytest.mark.parametrize(
    ("status", "body", "answer"),
    [
        (404, b'"Not here"', failure(404, "Not here")),
        (400, b'{"a": 1}', failure(400, '{"a": 1}')),
        (502, b'"Bad"', failure(500, "Bad")),
    ],
)
def test_json_that_is_not_ckans_is_a_failure_with_the_json_as_its_message_if_the_status_is(status, body, answer):
    assert adr_answer(status, body) == answer


@pytest.mark.parametrize(
    ("body", "answer"),
    [
        (b"<html>504 Gateway Time-out</html>", failure(504, "ADR request timed out")),
        (b"<html>502 Bad Gateway</html>", failure(502, "Failed to get response from ADR, try again later.")),
        (b"<html>Internal Server Error</html>", failure(500, "Could not parse response.")),
        (b"not json at all", failure(500, "Could not parse response.")),
        (b"", failure(500, "Could not parse response.")),
        (b"\xff\xfe", failure(500, "Could not parse response.")),
    ],
)
def test_a_body_that_is_not_json_is_a_failure(body, answer):
    assert adr_answer(500, body) == answer


@pytest.mark.parametrize(
    ("body", "detail"),
    [
        (b"<html>504 Gateway Time-out</html>", "La requête vers l'ADR a expiré."),
        (b"<html>502 Bad Gateway</html>", "Impossible d'obtenir une réponse de l'ADR. Veuillez réessayer plus tard."),
        (b"not json at all", "Impossible de lire la réponse."),
    ],
)
def test_the_failure_for_a_body_that_is_not_json_is_in_the_language_of_the_request(body, detail):
    assert adr_answer(500, body, "fr").envelope["errors"][0]["detail"] == detail


async def test_ckan_answers_of_the_fake_are_what_the_client_reads(client, adr):
    adr.fail("package_show", ckan_error(403, "No"))
    assert (await client.dataset("d")).envelope["errors"][0]["detail"] == "No"
    adr.fail("package_show", ckan_ok({"id": "d"}))
    assert (await client.dataset("d")).envelope["data"] == {"id": "d"}
