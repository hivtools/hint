"""The ADR client: who calls ADR, what it sends, and how the answer of ADR (or no answer) becomes an answer of this API.

These tests are true for every call to ADR, whichever endpoint makes it.
"""

import io
import json
import logging
import threading
from pathlib import Path
from typing import Any

import httpx2
import pytest
from pydantic import SecretStr

from app.clients.adr_client import (
    AdrClient,
    AdrFile,
    ResourceUpload,
    adr_answer,
    adr_authorization,
    create_adr_http_client,
)
from app.clients.responses import HintResponse
from app.config import Settings
from app.errors import NoAdrCredentialsError, NotOnAdrError
from app.utils import http_streams
from tests.adr import FakeAdr, ckan_error, ckan_ok, file_response
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
@pytest.mark.parametrize(
    ("adr_url", "called"),
    [
        ("https://adr.example", "https://adr.example/api/3/action/x"),
        ("https://adr.example/", "https://adr.example/api/3/action/x"),
        ("http://stub.example:8883/adr", "http://stub.example:8883/adr/api/3/action/x"),
        ("http://stub.example:8883/adr/", "http://stub.example:8883/adr/api/3/action/x"),
    ],
)
def test_the_address_may_or_may_not_end_with_a_slash(adr_url, called):
    client = create_adr_http_client(Settings(adr_url=adr_url))

    assert str(client.build_request("GET", "api/3/action/x").url) == called
    assert str(client.base_url.join("api/3/action/x")) == called


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


async def test_a_cookie_that_adr_sets_does_not_go_with_a_later_call(client, adr):
    """Every user's calls share one client, so a cookie that ADR sets for one user's call must not go with another's."""
    link = "https://adr.example/dataset/d/a.csv"
    set_cookie = {"Set-Cookie": "session=of-the-first-user; Path=/"}
    adr.answer(link, httpx2.Response(302, headers={"Location": "/back/a.csv", **set_cookie}))
    adr.answer("https://adr.example/back/a.csv", httpx2.Response(200, content=b"abc", headers=set_cookie))
    adr.fail("package_show", httpx2.Response(200, json={"success": True, "result": {}}, headers=set_cookie))

    await client.download(client.file_at(link), io.BytesIO(), 10)
    await client.dataset("d")
    await client.dataset("d")

    assert [call.headers.get("Cookie") for call in adr.calls] == [None] * 4


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


# ------------------------------------------------------------------------------------------------ a file to import
@pytest.mark.parametrize(
    ("link", "path"),
    [
        ("https://adr.example/dataset/d/resource/r/download/a.csv", "dataset/d/resource/r/download/a.csv"),
        ("https://ADR.example/dataset/d/a.csv?activity_id=1&x=2", "dataset/d/a.csv?activity_id=1&x=2"),
        ("HTTPS://adr.example/a.csv", "a.csv"),
        # The host is not used, so a link with another host is a path on ADR too
        ("https://dev-adr.example/dataset/d/a.csv", "dataset/d/a.csv"),
        ("http://evil.example:8443/a.csv", "a.csv"),
        ("https://user@adr.example.evil.example/a.csv", "a.csv"),
    ],
)
def test_the_path_and_query_of_a_link_are_a_file_on_adr_whatever_its_host(adr, link, path):
    assert AdrClient(adr.http, KEY, "en").file_at(link) == AdrFile(link, httpx2.URL(f"https://adr.example/{path}"))


@pytest.mark.parametrize(
    ("link", "path"),
    [
        ("http://127.0.0.1:8883/adr/dataset/d/a.csv", "dataset/d/a.csv"),
        ("http://stub.example/adr/a.csv?x=1", "a.csv?x=1"),
    ],
)
def test_when_the_address_of_adr_has_a_path_the_path_of_the_link_is_under_it(link, path):
    http = httpx2.AsyncClient(base_url="http://host.docker.internal:8883/adr/")

    expected = httpx2.URL(f"http://host.docker.internal:8883/adr/{path}")
    assert AdrClient(http, KEY, "en").file_at(link) == AdrFile(link, expected)


@pytest.mark.parametrize(
    "link",
    ["http://127.0.0.1:8883/dataset/d/a.csv", "http://127.0.0.1:8883/adrian/a.csv"],
)
def test_a_link_with_a_path_that_is_not_under_the_path_of_adr_is_refused(link):
    http = httpx2.AsyncClient(base_url="http://host.docker.internal:8883/adr/")

    with pytest.raises(NotOnAdrError):
        AdrClient(http, KEY, "en").file_at(link)


@pytest.mark.parametrize(
    "link",
    [
        "ftp://adr.example/a.csv",
        "not a url",
        "",
        "/dataset/d/a.csv",
        "http://[adr/a.csv",
        # httpx refuses these as addresses. The ids keep the long link out of the name of the test, which pytest puts in
        # an environment variable (at most 32767 characters on Windows).
        pytest.param("https://adr.example/a\x01.csv", id="control character"),
        pytest.param(f"https://adr.example/{'a' * 70_000}.csv", id="too long"),
    ],
)
def test_a_link_that_is_not_an_http_address_is_refused(adr, link):
    with pytest.raises(NotOnAdrError):
        AdrClient(adr.http, KEY, "en").file_at(link)


@pytest.mark.parametrize(
    ("link", "filename"),
    [
        ("https://adr.example/dataset/d/resource/r/download/a.PJNZ", "a.PJNZ"),
        ("https://adr.example/dataset/d/a.csv?next=/b/c.zip", "a.csv"),
        ("https://adr.example/dataset/d/", ""),
        ("https://adr.example/my%20file.csv", "my%20file.csv"),
    ],
)
def test_the_name_of_the_file_is_the_last_part_of_the_path_of_its_link(adr, link, filename):
    assert AdrClient(adr.http, KEY, "en").file_at(link).filename == filename


async def test_a_redirect_on_adr_keeps_the_credential_and_one_that_leaves_adr_drops_it_for_good(client, adr):
    link = "https://adr.example/dataset/d/a.csv"
    adr.redirect(link, "/elsewhere/a.csv")
    adr.redirect("https://adr.example/elsewhere/a.csv", "https://blob.example/a.csv")
    adr.redirect("https://blob.example/a.csv", "https://adr.example/back/a.csv")
    adr.answer("https://adr.example/back/a.csv", file_response(b"abc"))
    target = io.BytesIO()

    await client.download(client.file_at(link), target, 10)

    assert target.getvalue() == b"abc"
    assert [(str(c.url), c.headers.get("Authorization")) for c in adr.downloads()] == [
        (link, ADR_KEY),
        ("https://adr.example/elsewhere/a.csv", ADR_KEY),
        ("https://blob.example/a.csv", None),
        # Back on ADR, the credential is not sent again
        ("https://adr.example/back/a.csv", None),
    ]


async def test_a_download_is_a_success_with_no_data(client, adr):
    link = "https://adr.example/a.csv"
    adr.answer(link, file_response(b"abc"))

    assert await client.download(client.file_at(link), io.BytesIO(), 10) == HintResponse.success(None)


async def test_a_download_stops_as_soon_as_it_passes_the_limit(client, adr):
    link = "https://adr.example/a.csv"
    sent = []

    async def pieces():
        for piece in (b"12345", b"67890", b"x", b"never"):
            sent.append(piece)
            yield piece

    adr.answer(link, httpx2.Response(200, content=pieces()))
    target = io.BytesIO()

    answer = await client.download(client.file_at(link), target, 10)

    assert answer == failure(413, "The file is too large. Files can be up to 0 MB.", "FILE_TOO_LARGE")
    assert sent == [b"12345", b"67890", b"x"]
    assert target.getvalue() == b"1234567890"


async def test_a_spooled_download_gives_the_content_in_a_file_that_is_deleted_after_it(client, adr):
    link = "https://adr.example/a.csv"
    adr.answer(link, file_response(b"abcdef"))

    async with client.spooled_download(client.file_at(link), 10) as (answer, content):
        assert answer == HintResponse.success(None)
        content.seek(0)
        assert content.read() == b"abcdef"

    assert content.closed


async def test_a_spooled_download_that_is_larger_than_memory_is_on_the_disk(client, adr, monkeypatch):
    monkeypatch.setattr("app.clients.adr_client.IN_MEMORY_BYTES", 4)
    link = "https://adr.example/a.csv"
    adr.answer(link, file_response(b"abcdefgh", chunked=True))

    async with client.spooled_download(client.file_at(link), 10) as (answer, content):
        assert answer.ok
        assert content._rolled
        content.seek(0)
        assert content.read() == b"abcdefgh"


async def test_a_spooled_download_that_fails_gives_the_failure(client, adr):
    link = "https://adr.example/a.csv"
    adr.answer(link, file_response(b"abcdef"))

    async with client.spooled_download(client.file_at(link), 5) as (answer, content):
        assert answer == failure(413, "The file is too large. Files can be up to 0 MB.", "FILE_TOO_LARGE")

    assert content.closed


async def test_a_download_that_gets_no_answer_is_the_failure_of_any_call_that_gets_none(client, adr):
    link = "https://adr.example/a.csv"
    adr.fail_to_download(link, httpx2.ConnectError("connection refused"))
    adr.fail_to_connect("package_show", httpx2.ConnectError("connection refused"))

    assert await client.download(client.file_at(link), io.BytesIO(), 10) == await client.dataset("d")


async def test_a_download_needs_a_credential(adr):
    client = AdrClient(adr.http, None, "en")

    with pytest.raises(NoAdrCredentialsError):
        await client.download(client.file_at("https://adr.example/a.csv"), io.BytesIO(), 10)

    assert adr.calls == []


@pytest.mark.parametrize(
    ("dataset_id", "resource_id", "filename", "link"),
    [
        (
            "d-input-1",
            "r1",
            "a.csv",
            "https://adr.example/dataset/d-input-1/resource/r1/download/a.csv?activity_id=act-new",
        ),
        (
            "d-input-1",
            "r 1/2",
            "a b#.csv",
            "https://adr.example/dataset/d-input-1/resource/r%201%2F2/download/a%20b%23.csv?activity_id=act-new",
        ),
    ],
)
async def test_the_resource_url_is_the_download_link_at_the_newest_activity(
    client, adr, dataset_id, resource_id, filename, link
):
    assert await client.resource_url(dataset_id, resource_id, filename) == link
    assert adr.queries("package_activity_list") == [{"id": dataset_id}]


async def test_the_activity_id_is_encoded(client, adr):
    adr.fail("package_activity_list", ckan_ok([{"id": "a&b=c"}]))

    assert (await client.resource_url("d", "r", "a.csv")).endswith("?activity_id=a%26b%3Dc")


async def test_an_address_with_no_slash_at_the_end_gives_the_same_download_and_link(adr):
    client = AdrClient(adr.http_at("https://adr.example"), KEY, "en")
    link = "https://adr.example/dataset/d-input-1/resource/r1/download/a.csv"
    adr.answer(link, file_response(b"abc"))

    await client.download(client.file_at(link), io.BytesIO(), 10)

    assert str(adr.downloads()[0].url) == link
    assert await client.resource_url("d-input-1", "r1", "a.csv") == f"{link}?activity_id=act-new"


# ------------------------------------------------------------------------------------------------ the calls that change ADR
async def test_a_release_is_deleted_by_a_form_with_its_id(client, adr):
    answer = await client.delete_release("rel-1")

    assert answer == HintResponse.success(None)
    [call] = adr.calls
    assert (call.method, call.url.path, call.url.query) == ("POST", "/api/3/action/version_delete", b"")
    assert call.headers["Content-Type"] == "application/x-www-form-urlencoded"
    assert call.headers["Authorization"] == ADR_KEY
    assert adr.forms("version_delete") == [{"version_id": "rel-1"}]


async def test_a_release_is_made_by_a_form_with_the_dataset_and_the_name(client, adr):
    answer = await client.create_release("d-input-1", "Naomi: a project v1")

    assert answer.ok
    assert answer.data["name"] == "Naomi: a project v1"
    assert adr.forms("dataset_version_create") == [{"dataset_id": "d-input-1", "name": "Naomi: a project v1"}]


async def test_the_values_of_a_form_cannot_add_parameters(client, adr):
    await client.create_release("a&name=b", "c=d&e")

    assert adr.forms("dataset_version_create") == [{"dataset_id": "a&name=b", "name": "c=d&e"}]


@pytest.mark.parametrize("action", ["delete_release", "create_release"])
async def test_a_form_that_gets_no_answer_is_the_failure_of_any_call_that_gets_none(client, adr, action):
    adr.fail_to_connect("version_delete", httpx2.ConnectError("connection refused"))
    adr.fail_to_connect("dataset_version_create", httpx2.ConnectError("connection refused"))
    call = client.delete_release("r") if action == "delete_release" else client.create_release("d", "n")

    assert await call == failure(500, "No response returned. The request may have timed out.")


async def test_the_hash_of_a_resource_is_the_hash_that_adr_has(client, adr):
    adr.resources["res-1"] = {"id": "res-1", "hash": "ABC"}
    adr.resources["res-2"] = {"id": "res-2"}

    assert await client.resource_hash("res-1") == HintResponse.success("ABC")
    # ADR has no hash for it
    assert await client.resource_hash("res-2") == HintResponse.success(None)
    assert adr.queries("resource_show") == [{"id": "res-1"}, {"id": "res-2"}]


async def test_a_resource_that_adr_cannot_show_is_the_failure(client, adr):
    assert await client.resource_hash("none") == failure(500, "Not found", "ADR_ERROR")


@pytest.fixture
def file(tmp_path: Path) -> Path:
    path = tmp_path / "stored-under-a-hash"
    path.write_bytes(b"the content")
    return path


def upload_of(file: Path, description: str | None = None, name: str = "Naomi Output ZIP") -> ResourceUpload:
    return ResourceUpload(
        path=file,
        filename="naomi_outputs.zip",
        name=name,
        hash="ABC123",
        resource_type="inputs-unaids-naomi-output-zip",
        description=description,
    )


async def test_a_new_resource_is_a_multipart_form_with_the_file_as_the_part_upload(client, adr, file):
    answer = await client.create_resource("d-input-1", upload_of(file, description="Naomi model outputs"))

    assert answer.ok
    [call] = adr.calls
    assert (call.method, call.url.path, call.url.query) == ("POST", "/api/3/action/resource_create", b"")
    assert call.headers["Authorization"] == ADR_KEY
    assert call.headers["Content-Type"].startswith("multipart/form-data; boundary=")
    [upload] = adr.uploads
    assert (upload.filename, upload.content) == ("naomi_outputs.zip", b"the content")
    assert upload.fields == {
        "name": "Naomi Output ZIP",
        "hash": "ABC123",
        "resource_type": "inputs-unaids-naomi-output-zip",
        "description": "Naomi model outputs",
        "package_id": "d-input-1",
        "restricted": '{"allowed_organizations":"unaids","allowed_users":"","level":"restricted"}',
    }


async def test_a_resource_without_a_description_is_sent_without_one(client, adr, file):
    await client.create_resource("d", upload_of(file))

    assert "description" not in adr.uploads[0].fields


async def test_a_resource_that_is_replaced_has_its_id_and_is_not_made_restricted_again(client, adr, file):
    adr.resources["res-1"] = {"id": "res-1", "hash": "OLD"}

    answer = await client.update_resource("res-1", upload_of(file))

    assert answer.ok
    [call] = adr.calls
    assert call.url.path == "/api/3/action/resource_patch"
    assert adr.uploads[0].fields == {
        "name": "Naomi Output ZIP",
        "hash": "ABC123",
        "resource_type": "inputs-unaids-naomi-output-zip",
        "id": "res-1",
    }
    assert adr.resources["res-1"]["hash"] == "ABC123"


async def test_an_empty_file_is_sent(client, adr, file):
    file.write_bytes(b"")

    assert (await client.create_resource("d", upload_of(file))).ok
    assert adr.uploads[0].content == b""


async def test_the_body_of_an_upload_is_sent_with_its_length_in_pieces_read_in_a_thread(client, adr, file, monkeypatch):
    reading_threads = set()
    real = http_streams.next_piece

    def next_piece_in_a_thread(body):
        reading_threads.add(threading.get_ident())
        return real(body)

    monkeypatch.setattr(http_streams, "next_piece", next_piece_in_a_thread)
    file.write_bytes(b"x" * (300 * 1024))

    await client.create_resource("d", upload_of(file))

    [call] = adr.calls
    [pieces] = adr.body_pieces
    assert int(call.headers["Content-Length"]) == sum(pieces)
    assert "Transfer-Encoding" not in call.headers
    assert len(pieces) > 4
    # The file is read off the event loop, which every other request of the API shares
    assert reading_threads
    assert threading.get_ident() not in reading_threads


async def test_the_file_is_closed_after_the_upload_whether_adr_answers_or_not(client, adr, file, monkeypatch):
    opened = []
    real = Path.open

    def record(self, *args, **kwargs):
        handle = real(self, *args, **kwargs)
        opened.append(handle)
        return handle

    monkeypatch.setattr(Path, "open", record)
    adr.fail_to_connect("resource_patch", httpx2.WriteError("connection dropped"))

    await client.create_resource("d", upload_of(file))
    answer = await client.update_resource("r", upload_of(file))

    assert answer == failure(500, "No response returned. The request may have timed out.")
    assert len(opened) == 2
    assert all(handle.closed for handle in opened)


async def test_the_failure_of_an_upload_is_logged_without_the_credential_or_the_content(client, adr, file, caplog):
    adr.fail_to_connect("resource_create", httpx2.WriteError("connection dropped"))

    await client.create_resource("d", upload_of(file))

    assert [r.getMessage() for r in caplog.records if r.levelno == logging.ERROR] == ["No response from ADR"]
    assert ADR_KEY not in caplog.text
    assert "the content" not in caplog.text


@pytest.mark.parametrize("action", ["create", "update"])
async def test_an_upload_needs_a_credential_and_opens_no_file(adr, tmp_path, action):
    client = AdrClient(adr.http, None, "en")
    upload = upload_of(tmp_path / "does-not-exist")

    with pytest.raises(NoAdrCredentialsError):
        await (client.create_resource("d", upload) if action == "create" else client.update_resource("r", upload))

    assert adr.calls == []


@pytest.mark.parametrize("call", ["delete_release", "create_release", "resource_hash"])
async def test_the_other_calls_need_a_credential_too(adr, call):
    client = AdrClient(adr.http, None, "en")
    arguments = {"delete_release": ("r",), "create_release": ("d", "n"), "resource_hash": ("r",)}[call]

    with pytest.raises(NoAdrCredentialsError):
        await getattr(client, call)(*arguments)

    assert adr.calls == []


async def test_a_token_is_the_credential_of_an_upload(adr, file):
    await AdrClient(adr.http, SecretStr(f"Bearer {ADR_TOKEN}"), "en").create_resource("d", upload_of(file))

    assert adr.calls[0].headers["Authorization"] == f"Bearer {ADR_TOKEN}"


async def test_an_upload_waits_longer_for_the_answer_than_the_other_calls_and_no_longer_than_azure_does(
    client, adr, file
):
    await client.dataset("d")
    await client.create_resource("d", upload_of(file))

    get, post = (call.extensions["timeout"] for call in adr.calls)
    assert get == {"connect": 120, "read": 120, "write": 120, "pool": 120}
    # Azure cancels the request of the browser after 240 seconds
    assert post == {"connect": 120, "read": 220, "write": 120, "pool": 120}
