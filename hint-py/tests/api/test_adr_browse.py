"""The endpoints that read from ADR (app/routers/adr.py): the datasets, one dataset, its releases and the organisations.

These tests use a fake ADR (see tests/adr.py). The same calls to the real ADR are in tests/api/test_adr_live.py.
"""

from datetime import UTC, datetime, timedelta

import httpx2
import pytest
from cryptography.fernet import Fernet

from tests.adr import LAST_YEAR, THIS_YEAR, ckan_error, ckan_ok
from tests.api.helpers import make_client
from tests.support import ADR_KEY, ADR_TOKEN, SESSION_ENCRYPTION_KEY, USER

UNEXPECTED = "An unexpected error occurred."


def names(response: httpx2.Response) -> list[str]:
    return [d["name"] for d in response.json()["data"]]


def failure_of(response: httpx2.Response) -> dict:
    assert response.json()["status"] == "failure"
    [error] = response.json()["errors"]
    return error


# ------------------------------------------------------------------------------------------------ the datasets
async def test_input_datasets_are_this_years_that_have_a_file(adr_user, adr):
    r = await adr_user.get("/adr/datasets", params={"type": "input"})

    assert r.status_code == 200
    assert r.json()["status"] == "success"
    assert r.json()["errors"] == []
    # d-input-empty has no resources, and d-output-old is last year's
    assert names(r) == ["d-input-1", "d-output-1", "d-no-zip"]
    assert r.json()["data"][0]["resources"][0] == {
        "id": "r1",
        "name": "r1",
        "resource_type": "inputs-unaids-spectrum-file",
        "url": "http://adr.example/r1",
    }
    assert adr.queries("package_search") == [
        {
            "q": f"type:({THIS_YEAR})",
            "rows": "1000",
            "include_private": "true",
            "hide_inaccessible_resources": "true",
        }
    ]


async def test_output_datasets_are_this_years_and_last_years_that_have_an_output_zip(adr_user, adr):
    r = await adr_user.get("/adr/datasets", params={"type": "output"})

    assert names(r) == ["d-output-1", "d-output-old"]
    assert adr.queries("package_search")[0]["q"] == f"type:({THIS_YEAR} OR {LAST_YEAR})"


async def test_the_datasets_are_called_for_as_the_user_with_the_key(adr_user, adr):
    await adr_user.get("/adr/datasets", params={"type": "input"})

    [call] = adr.calls
    assert str(call.url).startswith("https://adr.example/api/3/action/package_search?")
    assert call.headers["Authorization"] == ADR_KEY


@pytest.mark.parametrize("value", ["true", "True", "1"])
async def test_the_datasets_the_user_cannot_use_are_asked_for_if_they_say_so(adr_user, adr, value):
    await adr_user.get("/adr/datasets", params={"type": "input", "showInaccessible": value})

    assert "hide_inaccessible_resources" not in adr.queries("package_search")[0]


@pytest.mark.parametrize("value", ["false", "False", "0"])
async def test_the_datasets_the_user_cannot_use_are_left_out_if_they_say_not(adr_user, adr, value):
    await adr_user.get("/adr/datasets", params={"type": "input", "showInaccessible": value})

    assert adr.queries("package_search")[0]["hide_inaccessible_resources"] == "true"


async def test_an_invalid_show_inaccessible_is_a_bad_request(adr_user, adr):
    r = await adr_user.get("/adr/datasets", params={"type": "input", "showInaccessible": "maybe"})

    assert r.status_code == 400
    assert failure_of(r)["detail"].startswith(UNEXPECTED)
    assert adr.calls == []


async def test_without_a_type_it_is_a_bad_request(adr_user, adr):
    r = await adr_user.get("/adr/datasets")

    assert r.status_code == 400
    assert failure_of(r)["detail"].startswith(UNEXPECTED)
    assert adr.calls == []


@pytest.mark.parametrize("dataset_type", ["bogus", "", "Input"])
async def test_a_type_that_is_not_input_or_output_is_a_bad_request(adr_user, adr, dataset_type):
    r = await adr_user.get("/adr/datasets", params={"type": dataset_type})

    assert r.status_code == 400
    assert failure_of(r)["detail"].startswith(UNEXPECTED)
    assert adr.calls == []


async def test_a_type_that_is_wrong_is_found_before_the_credentials_are(anonymous_user, adr):
    # With no credential, a call to ADR fails with the error "noADRKey" (status 400, as for a wrong type). So check the
    # message: it is the error for a wrong type, and not "noADRKey".
    r = await anonymous_user.get("/adr/datasets", params={"type": "bogus"})

    assert failure_of(r)["detail"].startswith(UNEXPECTED)
    assert adr.calls == []


async def test_no_datasets_is_an_empty_list(adr_user, adr):
    adr.fail("package_search", ckan_ok({"count": 0, "results": []}))

    for dataset_type in ("input", "output"):
        r = await adr_user.get("/adr/datasets", params={"type": dataset_type})
        assert r.json() == {"data": [], "errors": [], "status": "success"}


# Each failure has three parts: what ADR does, the status of the answer, and whether the user has no account on ADR.
# The message to the user is always one of two messages.
ADR_FAILURES = {
    "ckan 401": (ckan_error(401, "Access denied"), 500, False),
    "ckan 403, not logged in": (ckan_error(403, "User has not yet logged into ADR"), 500, True),
    "ckan 404": (ckan_error(404, "Not found"), 500, False),
    "ckan 500": (ckan_error(500, "Internal"), 500, False),
    "200 but not a success": (ckan_error(200, "weird"), 500, False),
    "500 html": (httpx2.Response(500, html="<html>Internal Server Error</html>"), 500, False),
    "502 html": (httpx2.Response(502, html="<html>502 Bad Gateway</html>"), 502, False),
    "504 html": (httpx2.Response(504, html="<html>504 Gateway Time-out</html>"), 504, False),
    "not json": (httpx2.Response(200, content=b"not json at all"), 500, False),
}


@pytest.mark.parametrize(("answer", "status", "no_account"), ADR_FAILURES.values(), ids=ADR_FAILURES.keys())
async def test_when_adr_fails_the_datasets_are_an_error_with_a_message_of_ours(
    adr_user, adr, answer, status, no_account
):
    adr.fail("package_search", answer)

    r = await adr_user.get("/adr/datasets", params={"type": "input"})

    assert r.status_code == status
    expected = (
        "Cannot fetch datasets from the ADR as you do not yet have an account. Please login to the ADR with your Auth0 "
        "credentials and then return here and try again."
        if no_account
        else "There was an error fetching datasets from ADR."
    )
    assert r.json() == {"data": {}, "errors": [{"error": "OTHER_ERROR", "detail": expected}], "status": "failure"}


async def test_when_adr_cannot_be_reached_the_datasets_are_an_error(adr_user, adr):
    adr.fail_to_connect("package_search", httpx2.ReadError("connection dropped"))

    r = await adr_user.get("/adr/datasets", params={"type": "input"})

    assert r.status_code == 500
    assert failure_of(r)["detail"] == "There was an error fetching datasets from ADR."


@pytest.mark.parametrize(
    ("language", "detail"),
    [
        ("fr", "Impossible de récupérer les ensembles de données de l'ADR car vous n'avez pas encore de compte."),
        ("pt", "Não é possível buscar conjuntos de dados do ADR porque você ainda não possui uma conta."),
    ],
)
async def test_the_error_of_a_user_who_has_no_account_at_adr_is_in_their_language(adr_user, adr, language, detail):
    adr.fail("package_search", ADR_FAILURES["ckan 403, not logged in"][0])

    r = await adr_user.get("/adr/datasets", params={"type": "input"}, headers={"Accept-Language": language})

    assert failure_of(r)["detail"].startswith(detail)


# ------------------------------------------------------------------------------------------------ one dataset
async def test_a_dataset_is_what_adr_has(adr_user, adr):
    r = await adr_user.get("/adr/datasets/d-input-1")

    assert r.status_code == 200
    assert r.json()["data"]["name"] == "d-input-1"
    assert r.json()["data"]["title"] == "Dataset d-input-1"
    assert r.json()["status"] == "success"
    assert adr.queries("package_show") == [{"id": "d-input-1"}]


async def test_a_dataset_can_be_the_one_of_a_release(adr_user, adr):
    r = await adr_user.get("/adr/datasets/d-output-1", params={"release": "rel-1"})

    assert [x["id"] for x in r.json()["data"]["resources"]] == ["r3"]
    assert adr.queries("package_show") == [{"id": "d-output-1", "release": "rel-1"}]


async def test_an_empty_release_is_asked_for_as_it_is(adr_user, adr):
    await adr_user.get("/adr/datasets/d-input-1", params={"release": ""})

    assert adr.queries("package_show") == [{"id": "d-input-1", "release": ""}]


async def test_a_dataset_that_adr_does_not_have_is_adrs_message(adr_user):
    r = await adr_user.get("/adr/datasets/unknown-dataset")

    assert r.status_code == 500
    assert r.json() == {"data": {}, "errors": [{"error": "ADR_ERROR", "detail": "Not found"}], "status": "failure"}


async def test_an_id_in_the_path_cannot_add_parameters_to_the_call_to_adr(adr_user, adr):
    await adr_user.get("/adr/datasets/a%26release%3Db")

    assert adr.queries("package_show") == [{"id": "a&release=b"}]


ONE_DATASET_FAILURES = {
    "ckan 500": (ckan_error(500, "boom"), 500, "ADR_ERROR", "boom"),
    "ckan 401": (ckan_error(401, "Authorization"), 500, "ADR_ERROR", "Authorization"),
    "garbage": (httpx2.Response(200, content=b"garbage"), 500, "OTHER_ERROR", "Could not parse response."),
    "504": (httpx2.Response(504, html="504 Gateway Time-out"), 504, "OTHER_ERROR", "ADR request timed out"),
    "502": (
        httpx2.Response(502, html="502 Bad Gateway"),
        502,
        "OTHER_ERROR",
        "Failed to get response from ADR, try again later.",
    ),
}


@pytest.mark.parametrize(
    ("answer", "status", "code", "detail"), ONE_DATASET_FAILURES.values(), ids=ONE_DATASET_FAILURES.keys()
)
async def test_when_adr_fails_a_dataset_is_the_failure_as_it_is(adr_user, adr, answer, status, code, detail):
    adr.fail("package_show", answer)

    r = await adr_user.get("/adr/datasets/d-input-1")

    assert r.status_code == status
    assert r.json() == {"data": {}, "errors": [{"error": code, "detail": detail}], "status": "failure"}


async def test_when_adr_cannot_be_reached_a_dataset_is_the_failure(adr_user, adr):
    adr.fail_to_connect("package_show", httpx2.ReadTimeout("timed out"))

    r = await adr_user.get("/adr/datasets/d-input-1")

    assert r.status_code == 500
    assert failure_of(r)["detail"] == "No response returned. The request may have timed out."


# ------------------------------------------------------------------------------------------------ the releases
async def test_the_releases_are_what_adr_has(adr_user, adr):
    r = await adr_user.get("/adr/datasets/d-output-1/releases")

    assert r.json() == {
        "data": [{"id": "rel-1", "name": "v1"}, {"id": "rel-2", "name": "v2"}],
        "errors": [],
        "status": "success",
    }
    assert adr.queries("dataset_version_list") == [{"dataset_id": "d-output-1"}]
    assert adr.queries("package_show") == []


async def test_a_dataset_that_has_no_releases_has_an_empty_list(adr_user):
    r = await adr_user.get("/adr/datasets/d-input-1/releases")

    assert r.json() == {"data": [], "errors": [], "status": "success"}


async def test_the_output_releases_are_the_ones_that_have_an_output_zip(adr_user, adr):
    r = await adr_user.get("/adr/datasets/d-output-1/releases", params={"type": "output"})

    assert r.json() == {"data": [{"id": "rel-1", "name": "v1"}], "errors": [], "status": "success"}
    # First the list of releases. Then one call for each release, one after the other.
    assert [(c.url.path.rsplit("/", 1)[-1], dict(c.url.params)) for c in adr.calls] == [
        ("dataset_version_list", {"dataset_id": "d-output-1"}),
        ("package_show", {"id": "d-output-1", "release": "rel-1"}),
        ("package_show", {"id": "d-output-1", "release": "rel-2"}),
    ]


async def test_any_other_type_is_not_filtered(adr_user, adr):
    r = await adr_user.get("/adr/datasets/d-output-1/releases", params={"type": "input"})

    assert names_of_ids(r) == ["rel-1", "rel-2"]
    assert adr.queries("package_show") == []


def names_of_ids(response: httpx2.Response) -> list[str]:
    return [release["id"] for release in response.json()["data"]]


async def test_a_dataset_that_has_no_releases_has_no_output_releases(adr_user, adr):
    r = await adr_user.get("/adr/datasets/d-input-1/releases", params={"type": "output"})

    assert r.json() == {"data": [], "errors": [], "status": "success"}
    assert adr.queries("package_show") == []


async def test_when_adr_fails_the_releases_are_the_failure(adr_user, adr):
    adr.fail("dataset_version_list", ckan_error(500, "boom"))

    r = await adr_user.get("/adr/datasets/d-output-1/releases")

    assert r.status_code == 500
    assert r.json() == {"data": {}, "errors": [{"error": "ADR_ERROR", "detail": "boom"}], "status": "failure"}


async def test_when_adr_fails_the_output_releases_are_none(adr_user, adr):
    # The failure is not shown to the user. The answer says that there are no releases.
    adr.fail("dataset_version_list", ckan_error(500, "boom"))

    r = await adr_user.get("/adr/datasets/d-output-1/releases", params={"type": "output"})

    assert r.json() == {"data": [], "errors": [], "status": "success"}


async def test_when_adr_fails_for_a_release_the_output_releases_are_an_unexpected_error(adr_user, adr):
    adr.fail("package_show", ckan_error(500, "boom"))

    r = await adr_user.get("/adr/datasets/d-output-1/releases", params={"type": "output"})

    assert r.status_code == 500
    assert failure_of(r)["detail"].startswith(UNEXPECTED)


# ------------------------------------------------------------------------------------------------ the organisations
async def test_the_organisations_are_the_ones_where_the_user_has_the_permission(adr_user, adr):
    r = await adr_user.get("/adr/orgs", params={"permission": "create_dataset"})

    assert r.json() == {
        "data": [{"id": "org-1", "name": "unaids"}, {"id": "org-2", "name": "ministry"}],
        "errors": [],
        "status": "success",
    }
    assert adr.queries("organization_list_for_user") == [{"permission": "create_dataset"}]


async def test_without_a_permission_it_is_a_bad_request(adr_user, adr):
    r = await adr_user.get("/adr/orgs")

    assert r.status_code == 400
    assert failure_of(r)["detail"].startswith(UNEXPECTED)
    assert adr.calls == []


async def test_when_adr_fails_the_organisations_are_the_failure(adr_user, adr):
    adr.fail("organization_list_for_user", ckan_error(500, "boom"))

    r = await adr_user.get("/adr/orgs", params={"permission": "read"})

    assert r.status_code == 500
    assert r.json()["errors"] == [{"error": "ADR_ERROR", "detail": "boom"}]


# ------------------------------------------------------------------------------------------------ who it is called as
ENDPOINTS = {
    "datasets": "/adr/datasets?type=input",
    "dataset": "/adr/datasets/d-input-1",
    "releases": "/adr/datasets/d-output-1/releases",
    "orgs": "/adr/orgs?permission=read",
}


@pytest.fixture
async def anonymous_user(adr, settings_overrides):
    """USER, with no credential for ADR: no access token in their session, and the settings have no API key."""
    async with make_client("test.user@example.com") as client:
        yield client


@pytest.mark.parametrize("path", ENDPOINTS.values(), ids=ENDPOINTS.keys())
async def test_without_a_token_or_a_key_adr_cannot_be_called_and_the_user_is_told(anonymous_user, adr, path):
    r = await anonymous_user.get(path)

    assert r.status_code == 400
    assert r.json() == {
        "data": {},
        "errors": [
            {
                "error": "OTHER_ERROR",
                "detail": "Could not find your ADR credentials. Please log out and log in again with your single sign-on account.",
            }
        ],
        "status": "failure",
    }
    assert adr.calls == []


@pytest.mark.parametrize(
    ("language", "start"),
    [
        ("fr", "Vos identifiants ADR sont introuvables."),
        ("pt", "Não foi possível encontrar as suas credenciais do ADR."),
    ],
)
async def test_the_message_for_no_credentials_is_in_the_language_of_the_request(anonymous_user, language, start):
    r = await anonymous_user.get(ENDPOINTS["orgs"], headers={"Accept-Language": language})

    assert failure_of(r)["detail"].startswith(start)


@pytest.mark.parametrize("path", ENDPOINTS.values(), ids=ENDPOINTS.keys())
async def test_with_a_token_adr_is_called_as_the_user(adr, settings_overrides, path):
    async with make_client(USER, access_token=ADR_TOKEN) as sso_user:
        r = await sso_user.get(path)

    assert r.status_code == 200
    [call, *_] = adr.calls
    assert call.headers["Authorization"] == f"Bearer {ADR_TOKEN}"


async def test_when_the_token_expires_the_session_ends(adr, settings_overrides):
    # A 401, so that the Vue app sends them to the login page. ADR is not called with a token that no longer works
    expired = datetime.now(UTC) - timedelta(minutes=1)
    async with make_client(USER, access_token=ADR_TOKEN, access_token_expires_at=expired) as sso_user:
        r = await sso_user.get(ENDPOINTS["orgs"])
        assert (await sso_user.get("/me")).json()["data"]["user"] == "guest"

    assert r.status_code == 401
    assert adr.calls == []


async def test_a_token_that_has_not_expired_is_used(adr, settings_overrides):
    later = datetime.now(UTC) + timedelta(hours=1)
    async with make_client(USER, access_token=ADR_TOKEN, access_token_expires_at=later) as sso_user:
        r = await sso_user.get(ENDPOINTS["orgs"])

    assert r.status_code == 200
    assert adr.calls[0].headers["Authorization"] == f"Bearer {ADR_TOKEN}"


async def test_a_token_is_still_read_after_a_new_key_is_added_before_the_old_one(adr, settings_overrides):
    settings_overrides["session_encryption_keys"] = f"{Fernet.generate_key().decode()},{SESSION_ENCRYPTION_KEY}"
    async with make_client(USER, access_token=ADR_TOKEN) as sso_user:
        r = await sso_user.get(ENDPOINTS["orgs"])

    assert r.status_code == 200


async def test_a_token_that_no_key_decrypts_ends_the_session(adr, settings_overrides):
    # Its key was removed: the user logs in again for a new token
    settings_overrides["session_encryption_keys"] = Fernet.generate_key().decode()
    async with make_client(USER, access_token=ADR_TOKEN) as sso_user:
        r = await sso_user.get(ENDPOINTS["orgs"])
        assert (await sso_user.get("/me")).json()["data"]["user"] == "guest"

    assert r.status_code == 401
    assert adr.calls == []


async def test_a_token_is_used_before_a_key(adr, settings_overrides):
    settings_overrides["environment"] = "development"
    settings_overrides["adr_api_key"] = ADR_KEY
    async with make_client(USER, access_token=ADR_TOKEN) as sso_user:
        await sso_user.get(ENDPOINTS["orgs"])

    assert adr.calls[0].headers["Authorization"] == f"Bearer {ADR_TOKEN}"


async def test_the_token_is_not_in_an_answer_when_adr_cannot_be_reached(adr, settings_overrides):
    adr.fail_to_connect("organization_list_for_user", httpx2.ConnectError("refused"))

    async with make_client(USER, access_token=ADR_TOKEN) as sso_user:
        r = await sso_user.get(ENDPOINTS["orgs"])

    assert ADR_TOKEN not in r.text


@pytest.mark.parametrize("path", ENDPOINTS.values(), ids=ENDPOINTS.keys())
async def test_a_guest_may_not_use_them(adr, settings_overrides, path):
    settings_overrides["environment"] = "development"
    settings_overrides["adr_api_key"] = ADR_KEY
    async with make_client("guest") as guest:
        r = await guest.get(path)

    assert r.status_code == 401
    assert adr.calls == []
