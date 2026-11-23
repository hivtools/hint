"""The endpoints that push to ADR: `POST /adr/datasets/{id}/releases` makes a release, and
`POST /adr/datasets/{id}/resource/{type}/{downloadId}` puts a file on ADR as a resource (app/routers/adr.py, and through
them app/services/adr_release_service.py and app/services/adr_resource_service.py).

ADR is the fake ADR of tests/adr.py, which keeps the releases and resources and records every call and every uploaded
file. hintr is the fake hintr of tests/hintr.py. The same endpoints are checked against the real dev ADR in
tests/api/test_adr_live_write.py, which never runs unless someone asks for it.
"""

import hashlib
import logging
import tempfile
from collections.abc import AsyncIterator
from pathlib import Path

import httpx2
import pytest
import pytest_asyncio

from app.services.file_types import INPUT_FILE_TYPES, OUTPUT_FILE_TYPES
from tests.adr import FakeAdr, ckan_error, ckan_ok
from tests.api.helpers import add_files, assert_failure, make_client
from tests.hintr import HINTR_FAILURE, success
from tests.support import ADR_KEY, ADR_TOKEN, USER

UNEXPECTED = "An unexpected error occurred."
# What a request needs for any kind of file
REQUIRED = {"resourceFileName": "naomi_outputs.zip", "resourceName": "Naomi Output ZIP"}

# The kinds of file, with their resource types
OUTPUTS = {spec.key: spec.adr_resource_type for spec in OUTPUT_FILE_TYPES}
INPUTS = {spec.file_type.value: spec.adr_resource_type for spec in INPUT_FILE_TYPES.values()}

CONTENT = b"the content of a file"
OUTPUT_PATH = "t1/output.zip"


def md5(content: bytes) -> str:
    return hashlib.md5(content, usedforsecurity=False).hexdigest().upper()


def push_path(resource_type: str, download_id: str = "t1", dataset_id: str = "ds1") -> str:
    return f"/adr/datasets/{dataset_id}/resource/{resource_type}/{download_id}"


def failure_of(response: httpx2.Response) -> dict:
    assert response.json()["status"] == "failure"
    [error] = response.json()["errors"]
    return error


@pytest_asyncio.fixture
async def pusher(
    adr: FakeAdr, hintr, settings_overrides: dict, uploads_dir: Path, results_dir: Path, version_id: str
) -> AsyncIterator[httpx2.AsyncClient]:
    """USER on a version, in development, where ADR is called with the key of the settings. hintr says that the download
    `t1` is `t1/output.zip` in the results folder, and that file has CONTENT."""
    settings_overrides["environment"] = "development"
    settings_overrides["adr_api_key"] = ADR_KEY
    (results_dir / "t1").mkdir()
    (results_dir / OUTPUT_PATH).write_bytes(CONTENT)
    hintr.answer(200, json=success({"path": OUTPUT_PATH, "metadata": METADATA}))
    async with make_client(USER, version_id) as client:
        yield client


METADATA = {
    "id": "t1",
    "areas": "MWI",
    "type": "spectrum",
    "file_label": "naomi-outputs",
    "file_extension": ".zip",
    "description": "Output",
}


async def give_input_file(engine, version_id: str, uploads_dir: Path, file_type: str, content: bytes = CONTENT) -> str:
    """The version has an input file of the type (the name that it was uploaded with is `<type>.<type>`)."""
    await add_files(engine, version_id, file_type)
    (uploads_dir / f"{file_type}123").write_bytes(content)
    return f"{file_type}.{file_type}"


# ------------------------------------------------------------------------------------------------ a release
@pytest.mark.parametrize("how", ["form", "query"])
async def test_a_release_is_made_with_its_name(pusher, adr, how):
    # The Vue app sends the name in the body, as a form. Other callers can put it in the query.
    r = await pusher.post(
        "/adr/datasets/d-input-1/releases",
        **({"data": {"name": "v1"}} if how == "form" else {"params": {"name": "v1"}}),
    )

    assert r.status_code == 200
    assert r.json()["status"] == "success"
    assert r.json()["data"] == {"id": r.json()["data"]["id"], "dataset_id": "d-input-1", "name": "v1"}
    assert [c.url.path.rsplit("/", 1)[-1] for c in adr.calls] == ["dataset_version_list", "dataset_version_create"]
    assert adr.forms("dataset_version_create") == [{"dataset_id": "d-input-1", "name": "v1"}]
    assert adr.releases["d-input-1"] == [r.json()["data"]]


async def test_a_release_is_made_with_a_form_and_nothing_in_the_url(pusher, adr):
    await pusher.post("/adr/datasets/d-input-1/releases", data={"name": "v1"})

    create = adr.calls[-1]
    assert create.method == "POST"
    assert create.url.query == b""
    assert create.headers["Content-Type"] == "application/x-www-form-urlencoded"
    assert create.headers["Authorization"] == ADR_KEY


async def test_the_name_in_the_query_is_used_before_the_one_in_a_form(pusher, adr):
    await pusher.post("/adr/datasets/d-input-1/releases", params={"name": "from query"}, data={"name": "from form"})

    assert adr.forms("dataset_version_create")[0]["name"] == "from query"


async def test_an_id_or_a_name_cannot_add_parameters_to_the_calls_to_adr(pusher, adr):
    await pusher.post("/adr/datasets/a%26b%3Dc/releases", data={"name": "v1&dataset_id=other#x y"})

    assert adr.queries("dataset_version_list") == [{"dataset_id": "a&b=c"}]
    assert adr.forms("dataset_version_create") == [{"dataset_id": "a&b=c", "name": "v1&dataset_id=other#x y"}]


async def test_a_release_with_the_name_of_an_old_one_replaces_it(pusher, adr):
    r = await pusher.post("/adr/datasets/d-output-1/releases", data={"name": "v1"})

    assert r.status_code == 200
    # The old release is deleted first, by its id. ADR does not allow two releases with one name.
    assert [c.url.path.rsplit("/", 1)[-1] for c in adr.calls] == [
        "dataset_version_list",
        "version_delete",
        "dataset_version_create",
    ]
    assert adr.forms("version_delete") == [{"version_id": "rel-1"}]
    assert adr.forms("dataset_version_create") == [{"dataset_id": "d-output-1", "name": "v1"}]
    assert [release["name"] for release in adr.releases["d-output-1"]] == ["v2", "v1"]
    assert r.json()["data"]["id"] not in ("rel-1", "rel-2")


async def test_only_a_release_with_the_same_name_is_deleted(pusher, adr):
    await pusher.post("/adr/datasets/d-output-1/releases", data={"name": "v3"})

    assert adr.forms("version_delete") == []
    assert [release["name"] for release in adr.releases["d-output-1"]] == ["v1", "v2", "v3"]


async def test_the_name_is_the_same_only_if_it_is_exactly_the_same(pusher, adr):
    await pusher.post("/adr/datasets/d-output-1/releases", data={"name": "V1"})
    await pusher.post("/adr/datasets/d-output-1/releases", data={"name": "v1 "})

    assert adr.forms("version_delete") == []


async def test_if_there_are_two_releases_with_the_name_only_the_first_is_deleted(pusher, adr):
    adr.releases["ds"] = [{"id": "a", "name": "v1"}, {"id": "b", "name": "v1"}]

    r = await pusher.post("/adr/datasets/ds/releases", data={"name": "v1"})

    assert adr.forms("version_delete") == [{"version_id": "a"}]
    # ADR does not let the new release have the name of the one that is left
    assert r.status_code == 500
    assert failure_of(r) == {"error": "ADR_ERROR", "detail": "Version names must be unique per dataset"}


async def test_if_the_new_release_fails_after_the_old_one_was_deleted_the_old_one_is_gone(pusher, adr):
    """The delete cannot be undone, and nothing here puts the release back (see D19 in docs/porting-checklist.md)."""
    adr.fail("dataset_version_create", ckan_error(500, "create failed"))

    r = await pusher.post("/adr/datasets/d-output-1/releases", data={"name": "v1"})

    assert r.status_code == 500
    assert failure_of(r) == {"error": "ADR_ERROR", "detail": "create failed"}
    assert [release["name"] for release in adr.releases["d-output-1"]] == ["v2"]
    assert [c.url.path.rsplit("/", 1)[-1] for c in adr.calls] == [
        "dataset_version_list",
        "version_delete",
        "dataset_version_create",
    ]


async def test_if_the_list_of_releases_fails_nothing_else_is_asked(pusher, adr):
    adr.fail("dataset_version_list", ckan_error(500, "list failed"))

    r = await pusher.post("/adr/datasets/d-output-1/releases", data={"name": "v1"})

    assert r.status_code == 500
    assert failure_of(r) == {"error": "ADR_ERROR", "detail": "list failed"}
    assert len(adr.calls) == 1


async def test_if_the_delete_fails_no_release_is_made(pusher, adr):
    adr.fail("version_delete", ckan_error(500, "delete failed"))

    r = await pusher.post("/adr/datasets/d-output-1/releases", data={"name": "v1"})

    assert failure_of(r) == {"error": "ADR_ERROR", "detail": "delete failed"}
    assert [c.url.path.rsplit("/", 1)[-1] for c in adr.calls] == ["dataset_version_list", "version_delete"]
    assert [release["name"] for release in adr.releases["d-output-1"]] == ["v1", "v2"]


ADR_FAILURES = {
    "ckan error": (ckan_error(500, "boom"), 500, "ADR_ERROR", "boom"),
    "ckan 401": (ckan_error(401, "auth"), 500, "ADR_ERROR", "auth"),
    "garbage": (httpx2.Response(200, content=b"garbage"), 500, "OTHER_ERROR", "Could not parse response."),
    "504": (httpx2.Response(504, html="504 Gateway Time-out"), 504, "OTHER_ERROR", "ADR request timed out"),
    "502": (
        httpx2.Response(502, html="502 Bad Gateway"),
        502,
        "OTHER_ERROR",
        "Failed to get response from ADR, try again later.",
    ),
}
STEPS_OF_A_RELEASE = ["dataset_version_list", "version_delete", "dataset_version_create"]


@pytest.mark.parametrize("action", STEPS_OF_A_RELEASE)
@pytest.mark.parametrize(("answer", "status", "code", "detail"), ADR_FAILURES.values(), ids=ADR_FAILURES.keys())
async def test_when_adr_fails_at_a_step_of_a_release_the_failure_is_the_answer(
    pusher, adr, action, answer, status, code, detail
):
    adr.fail(action, answer)

    r = await pusher.post("/adr/datasets/d-output-1/releases", data={"name": "v1"})

    assert r.status_code == status
    assert r.json() == {"data": {}, "errors": [{"error": code, "detail": detail}], "status": "failure"}
    # It stops at the step that fails
    assert [c.url.path.rsplit("/", 1)[-1] for c in adr.calls][-1] == action


@pytest.mark.parametrize("action", STEPS_OF_A_RELEASE)
async def test_when_adr_does_not_answer_at_a_step_of_a_release_that_is_the_failure(pusher, adr, action):
    adr.fail_to_connect(action, httpx2.ReadTimeout("timed out"))

    r = await pusher.post("/adr/datasets/d-output-1/releases", data={"name": "v1"})

    assert r.status_code == 500
    assert_failure(r, 500, "No response returned. The request may have timed out.")
    assert [c.url.path.rsplit("/", 1)[-1] for c in adr.calls][-1] == action


async def test_the_failure_of_adr_is_in_the_language_of_the_request(pusher, adr):
    adr.fail("dataset_version_create", httpx2.Response(200, content=b"garbage"))

    r = await pusher.post("/adr/datasets/ds/releases", data={"name": "v"}, headers={"Accept-Language": "fr"})

    assert failure_of(r)["detail"] == "Impossible de lire la réponse."


@pytest.mark.parametrize("kwargs", [{}, {"data": {"other": "x"}}, {"json": {"name": "v1"}}])
async def test_a_release_needs_a_name_and_it_is_not_asked_from_adr_without_one(pusher, adr, kwargs):
    r = await pusher.post("/adr/datasets/d-output-1/releases", **kwargs)

    assert r.status_code == 400
    assert failure_of(r)["detail"].startswith(UNEXPECTED)
    assert adr.calls == []


async def test_a_form_that_is_far_larger_than_any_real_one_is_a_bad_request(pusher, adr):
    r = await pusher.post("/adr/datasets/d-output-1/releases", data={"name": "x" * 100_000})

    assert r.status_code == 400
    assert failure_of(r)["detail"].startswith(UNEXPECTED)
    assert adr.calls == []


async def test_an_empty_name_is_a_name(pusher, adr):
    await pusher.post("/adr/datasets/d-input-1/releases", params={"name": ""})

    assert adr.forms("dataset_version_create") == [{"dataset_id": "d-input-1", "name": ""}]


# ------------------------------------------------------------------------------------------------ who may push
RELEASE = ("/adr/datasets/d-output-1/releases", {"name": "v1"})
PUSH = (push_path(OUTPUTS["outputZip"]), {**REQUIRED, "description": "d"})


@pytest.mark.parametrize(("path", "form"), [RELEASE, PUSH], ids=["release", "push"])
async def test_a_guest_cannot_push(pusher, adr, hintr, path, form):
    async with make_client("guest") as guest:
        r = await guest.post(path, data=form)

    assert_failure(r, 401, "Login required")
    assert adr.calls == []
    assert hintr.calls == []


@pytest.mark.parametrize(("path", "form"), [RELEASE, PUSH], ids=["release", "push"])
async def test_a_push_needs_the_identity_from_the_proxy(anonymous_client, adr, path, form):
    r = await anonymous_client.post(path, data=form)

    assert r.status_code == 401
    assert adr.calls == []


@pytest.mark.parametrize(("path", "form"), [RELEASE, PUSH], ids=["release", "push"])
async def test_without_a_token_or_a_key_nothing_is_sent_to_adr_and_the_user_is_told(
    pusher, adr, settings_overrides, path, form
):
    settings_overrides["adr_api_key"] = None

    r = await pusher.post(path, data=form)

    assert r.status_code == 400
    assert failure_of(r)["detail"].startswith("Could not find your ADR credentials.")
    assert adr.calls == []


@pytest.mark.parametrize(
    ("language", "start"),
    [
        ("fr", "Vos identifiants ADR sont introuvables."),
        ("pt", "Não foi possível encontrar as suas credenciais do ADR."),
    ],
)
async def test_the_message_for_no_credentials_is_in_the_language_of_the_request(
    pusher, settings_overrides, language, start
):
    settings_overrides["adr_api_key"] = None

    r = await pusher.post(*RELEASE[:1], data=RELEASE[1], headers={"Accept-Language": language})

    assert failure_of(r)["detail"].startswith(start)


@pytest.mark.parametrize(("path", "form"), [RELEASE, PUSH], ids=["release", "push"])
async def test_a_token_is_used_in_place_of_the_key_for_every_call_to_adr(pusher, adr, path, form):
    adr.resources["r1"] = {"id": "r1", "hash": "0" * 32}
    form = {**form, "resourceId": "r1"}

    r = await pusher.post(path, data=form, headers={"X-Hint-Access-Token": ADR_TOKEN})

    assert r.status_code == 200
    assert len(adr.calls) >= 2
    assert {call.headers["Authorization"] for call in adr.calls} == {f"Bearer {ADR_TOKEN}"}


async def test_the_key_is_used_for_every_call_to_adr_when_there_is_no_token(pusher, adr):
    adr.resources["r1"] = {"id": "r1", "hash": "0" * 32}

    await pusher.post(PUSH[0], data={**PUSH[1], "resourceId": "r1"})

    assert [c.url.path.rsplit("/", 1)[-1] for c in adr.calls] == ["resource_show", "resource_patch"]
    assert {call.headers["Authorization"] for call in adr.calls} == {ADR_KEY}


# ------------------------------------------------------------------------------------------------ an output file
@pytest.mark.parametrize("kind", OUTPUTS)
async def test_an_output_with_no_resource_id_is_a_new_resource(pusher, adr, hintr, kind):
    r = await pusher.post(push_path(OUTPUTS[kind]), data={**REQUIRED, "description": "Naomi model outputs"})

    assert r.status_code == 200
    assert r.json()["status"] == "success"
    assert r.json()["data"]["id"] == "new-resource-1"
    assert r.json()["data"]["hash"] == md5(CONTENT)
    # The file of the download is where hintr says. hintr is not asked for the file itself, only where it is.
    assert [(c.method, c.url.path) for c in hintr.calls] == [("GET", "/download/result/path/t1")]
    # ADR is not asked about a resource that does not exist yet
    assert [c.url.path.rsplit("/", 1)[-1] for c in adr.calls] == ["resource_create"]
    [upload] = adr.uploads
    assert upload.content == CONTENT
    assert upload.filename == "naomi_outputs.zip"
    assert upload.fields == {
        "name": "Naomi Output ZIP",
        "hash": md5(CONTENT),
        "resource_type": OUTPUTS[kind],
        "description": "Naomi model outputs",
        "package_id": "ds1",
        "restricted": '{"allowed_organizations":"unaids","allowed_users":"","level":"restricted"}',
    }
    assert adr.calls[0].headers["Authorization"] == ADR_KEY


@pytest.mark.parametrize("how", ["form", "query"])
async def test_the_parameters_can_be_a_form_or_in_the_query(pusher, adr, how):
    # The Vue app sends a form. The contract tests and other callers use the query.
    params = {**REQUIRED, "description": "d"}

    r = await pusher.post(
        push_path(OUTPUTS["outputZip"]), **({"data": params} if how == "form" else {"params": params})
    )

    assert r.status_code == 200
    assert adr.uploads[0].fields["description"] == "d"


async def test_an_output_with_a_resource_id_is_sent_if_adr_has_another_file(pusher, adr):
    adr.resources["res-1"] = {"id": "res-1", "hash": "0" * 32}

    r = await pusher.post(
        push_path(OUTPUTS["outputSummary"]), data={**REQUIRED, "description": "d", "resourceId": "res-1"}
    )

    assert r.status_code == 200
    assert adr.queries("resource_show") == [{"id": "res-1"}]
    [upload] = adr.uploads
    assert upload.action == "resource_patch"
    assert upload.content == CONTENT
    assert upload.fields == {
        "name": "Naomi Output ZIP",
        "hash": md5(CONTENT),
        "resource_type": OUTPUTS["outputSummary"],
        "description": "d",
        "id": "res-1",
    }
    assert adr.resources["res-1"]["hash"] == md5(CONTENT)


async def test_an_output_that_adr_has_already_is_not_sent_again(pusher, adr):
    adr.resources["res-1"] = {"id": "res-1", "hash": md5(CONTENT)}

    r = await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d", "resourceId": "res-1"})

    assert r.json() == {"data": True, "errors": [], "status": "success"}
    assert [c.url.path.rsplit("/", 1)[-1] for c in adr.calls] == ["resource_show"]
    assert adr.uploads == []


async def test_the_hash_is_compared_as_it_is_so_a_hash_in_lower_case_is_a_change(pusher, adr):
    # ADR has the hashes that clients gave it. The hash that is sent is in upper case, as it always was.
    adr.resources["res-1"] = {"id": "res-1", "hash": md5(CONTENT).lower()}

    await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d", "resourceId": "res-1"})

    assert len(adr.uploads) == 1


async def test_a_resource_that_has_no_hash_gets_the_file(pusher, adr):
    adr.resources["res-1"] = {"id": "res-1"}

    await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d", "resourceId": "res-1"})

    assert len(adr.uploads) == 1


async def test_the_file_is_named_as_the_request_says_not_as_hintr_does(pusher, adr):
    await pusher.post(
        push_path(OUTPUTS["outputZip"]),
        data={"resourceFileName": 'my "report".html', "resourceName": "n", "description": "d"},
    )

    # The quotes are escaped in the multipart form, as a browser does it
    assert adr.uploads[0].filename == "my %22report%22.html"


async def test_an_empty_description_is_a_description(pusher, adr):
    r = await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": ""})

    assert r.status_code == 200
    assert adr.uploads[0].fields["description"] == ""


# ------------------------------------------------------------------------------------------------ an input file
@pytest.mark.parametrize("kind", INPUTS)
async def test_an_input_file_replaces_the_resource_if_adr_has_another_file(
    pusher, adr, hintr, engine, version_id, uploads_dir, kind
):
    name = await give_input_file(engine, version_id, uploads_dir, kind)
    adr.resources["res-in"] = {"id": "res-in", "hash": "f" * 32}

    # `resourceFileName` and the download id do not matter for an input file
    r = await pusher.post(
        push_path(INPUTS[kind], "no-such-download"),
        data={"resourceFileName": "ignored.name", "resourceName": f"My {kind}", "resourceId": "res-in"},
    )

    assert r.status_code == 200
    assert [c.url.path.rsplit("/", 1)[-1] for c in adr.calls] == ["resource_show", "resource_patch"]
    [upload] = adr.uploads
    assert upload.content == CONTENT
    # The name that the file was uploaded with
    assert upload.filename == name
    # An input file has no description
    assert upload.fields == {
        "name": f"My {kind}",
        "hash": md5(CONTENT),
        "resource_type": INPUTS[kind],
        "id": "res-in",
    }
    assert hintr.calls == []


@pytest.mark.parametrize("kind", INPUTS)
async def test_an_input_file_that_adr_has_already_is_not_sent_again(pusher, adr, engine, version_id, uploads_dir, kind):
    await give_input_file(engine, version_id, uploads_dir, kind)
    adr.resources["res-in"] = {"id": "res-in", "hash": md5(CONTENT)}

    r = await pusher.post(push_path(INPUTS[kind]), data={**REQUIRED, "resourceId": "res-in"})

    assert r.json() == {"data": True, "errors": [], "status": "success"}
    assert adr.uploads == []
    assert [c.url.path.rsplit("/", 1)[-1] for c in adr.calls] == ["resource_show"]


async def test_a_description_for_an_input_file_is_not_sent(pusher, adr, engine, version_id, uploads_dir):
    await give_input_file(engine, version_id, uploads_dir, "pjnz")
    adr.resources["res-in"] = {"id": "res-in", "hash": "f" * 32}

    await pusher.post(push_path(INPUTS["pjnz"]), data={**REQUIRED, "resourceId": "res-in", "description": "ignored"})

    assert "description" not in adr.uploads[0].fields


async def test_only_the_file_of_the_type_is_pushed(pusher, adr, engine, version_id, uploads_dir):
    await add_files(engine, version_id, "shape", "pjnz")
    (uploads_dir / "shape123").write_bytes(b"the shape file")
    (uploads_dir / "pjnz123").write_bytes(b"the pjnz file")
    adr.resources["res-in"] = {"id": "res-in", "hash": "f" * 32}

    await pusher.post(push_path(INPUTS["shape"]), data={**REQUIRED, "resourceId": "res-in"})

    assert adr.uploads[0].content == b"the shape file"


# ------------------------------------------------------------------------------------------------ what is refused
async def test_a_resource_type_that_is_not_known_is_a_bad_request(pusher, adr, hintr):
    r = await pusher.post(push_path("not-a-type"), data={**REQUIRED, "description": "d"})

    assert_failure(r, 400, "Invalid resourceType")
    assert adr.calls == []
    assert hintr.calls == []


async def test_an_output_needs_a_description_and_hintr_is_not_asked_without_one(pusher, adr, hintr):
    r = await pusher.post(push_path(OUTPUTS["outputZip"]), data=REQUIRED)

    assert_failure(r, 400, "description must be provided for output resourceType")
    assert adr.calls == []
    assert hintr.calls == []


async def test_an_input_file_needs_a_resource_id(pusher, adr, engine, version_id, uploads_dir):
    await give_input_file(engine, version_id, uploads_dir, "pjnz")

    r = await pusher.post(push_path(INPUTS["pjnz"]), data=REQUIRED)

    assert_failure(r, 400, "resourceId must be provided for input resourceType")
    assert adr.calls == []


async def test_an_input_file_that_the_version_does_not_have_is_a_bad_request(pusher, adr, engine, version_id):
    await add_files(engine, version_id, "shape")

    r = await pusher.post(push_path(INPUTS["pjnz"]), data={**REQUIRED, "resourceId": "res-in"})

    assert_failure(r, 400, "File does not exist")
    assert adr.calls == []


async def test_the_resource_id_is_checked_before_the_file_is_looked_for(pusher, adr):
    r = await pusher.post(push_path(INPUTS["pjnz"]), data=REQUIRED)

    assert failure_of(r)["detail"] == "resourceId must be provided for input resourceType"


@pytest.mark.parametrize("missing", ["resourceFileName", "resourceName"])
@pytest.mark.parametrize("resource_type", [OUTPUTS["outputZip"], INPUTS["pjnz"], "not-a-type"])
async def test_the_name_of_the_file_and_of_the_resource_are_needed_for_every_type(
    pusher, adr, hintr, resource_type, missing
):
    form = {**REQUIRED, "description": "d", "resourceId": "r"}
    del form[missing]

    r = await pusher.post(push_path(resource_type), data=form)

    assert r.status_code == 400
    assert failure_of(r)["detail"].startswith(UNEXPECTED)
    assert adr.calls == []
    assert hintr.calls == []


async def test_a_push_needs_a_version_even_for_an_output(adr, hintr, settings_overrides, results_dir, api):
    # The Vue app always sends one. An endpoint that is for a version checks it, as the download endpoints do.
    settings_overrides["environment"] = "development"
    settings_overrides["adr_api_key"] = ADR_KEY

    async with make_client(USER) as no_version:
        r = await no_version.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d"})

    assert r.status_code == 403
    assert failure_of(r)["error"] == "INVALID_VERSION"
    assert adr.calls == []


# ------------------------------------------------------------------------------------------------ hintr and the files
async def test_when_hintr_fails_its_failure_is_the_answer_and_adr_is_not_called(pusher, adr, hintr):
    hintr.answer(400, json=HINTR_FAILURE)

    r = await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d"})

    assert r.status_code == 400
    assert r.json() == HINTR_FAILURE
    assert adr.calls == []


async def test_when_hintr_does_not_answer_that_is_the_failure(pusher, adr, hintr):
    hintr.fail_to_connect(httpx2.ConnectError("refused"))

    r = await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d"})

    assert_failure(r, 500, "No response returned. The request may have timed out.")
    assert adr.calls == []


async def test_a_download_that_hintr_has_but_is_not_in_the_results_folder_is_an_unexpected_error(
    pusher, adr, results_dir
):
    (results_dir / OUTPUT_PATH).unlink()

    r = await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d"})

    assert r.status_code == 500
    assert failure_of(r)["detail"].startswith(UNEXPECTED)
    assert adr.calls == []


async def test_a_path_from_hintr_that_leaves_the_results_folder_is_not_sent(pusher, adr, hintr, results_dir):
    (results_dir.parent / "secret.txt").write_bytes(b"not a result")
    hintr.answer(200, json=success({"path": "../secret.txt", "metadata": METADATA}))

    r = await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d"})

    assert r.status_code == 500
    assert adr.calls == []


async def test_an_input_file_that_is_in_the_database_and_not_in_the_uploads_folder_is_an_unexpected_error(
    pusher, adr, engine, version_id, caplog
):
    await add_files(engine, version_id, "pjnz")

    r = await pusher.post(push_path(INPUTS["pjnz"]), data={**REQUIRED, "resourceId": "res-in"})

    assert r.status_code == 500
    assert failure_of(r)["detail"].startswith(UNEXPECTED)
    assert adr.calls == []
    assert any(record.getMessage().startswith("File of the version missing") for record in caplog.records)


# ------------------------------------------------------------------------------------------------ when adr fails
@pytest.mark.parametrize(("answer", "status", "code", "detail"), ADR_FAILURES.values(), ids=ADR_FAILURES.keys())
async def test_when_adr_fails_to_take_a_new_resource_the_failure_is_the_answer(
    pusher, adr, answer, status, code, detail
):
    adr.fail("resource_create", answer)

    r = await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d"})

    assert r.status_code == status
    assert r.json() == {"data": {}, "errors": [{"error": code, "detail": detail}], "status": "failure"}


@pytest.mark.parametrize(("answer", "status", "code", "detail"), ADR_FAILURES.values(), ids=ADR_FAILURES.keys())
async def test_when_adr_fails_to_take_a_new_file_for_a_resource_the_failure_is_the_answer(
    pusher, adr, answer, status, code, detail
):
    adr.resources["res-1"] = {"id": "res-1", "hash": "0" * 32}
    adr.fail("resource_patch", answer)

    r = await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d", "resourceId": "res-1"})

    assert r.status_code == status
    assert r.json() == {"data": {}, "errors": [{"error": code, "detail": detail}], "status": "failure"}


@pytest.mark.parametrize("action", ["resource_create", "resource_patch"])
async def test_when_adr_does_not_answer_to_an_upload_that_is_the_failure(pusher, adr, action):
    adr.resources["res-1"] = {"id": "res-1", "hash": "0" * 32}
    adr.fail_to_connect(action, httpx2.ReadError("connection dropped"))
    form = {**REQUIRED, "description": "d", **({"resourceId": "res-1"} if action == "resource_patch" else {})}

    r = await pusher.post(push_path(OUTPUTS["outputZip"]), data=form)

    assert_failure(r, 500, "No response returned. The request may have timed out.")
    assert len(adr.calls) == (2 if action == "resource_patch" else 1)


SHOW_FAILURES = {
    "ckan error": ckan_error(500, "show failed"),
    "not found": ckan_error(404, "Not found", "Not Found Error"),
    "garbage": httpx2.Response(200, content=b"garbage"),
    "504": httpx2.Response(504, html="504 Gateway Time-out"),
}


@pytest.mark.parametrize("answer", SHOW_FAILURES.values(), ids=SHOW_FAILURES.keys())
async def test_when_the_hash_of_the_resource_cannot_be_had_nothing_is_sent(pusher, adr, answer):
    adr.fail("resource_show", answer)

    r = await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d", "resourceId": "res-1"})

    assert_failure(r, 500, "Unable to retrieve hash from ADR")
    assert adr.uploads == []
    assert [c.url.path.rsplit("/", 1)[-1] for c in adr.calls] == ["resource_show"]


async def test_a_resource_that_adr_does_not_know_is_the_same_failure(pusher, adr):
    r = await pusher.post(
        push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d", "resourceId": "no-such-resource"}
    )

    assert_failure(r, 500, "Unable to retrieve hash from ADR")


async def test_when_adr_does_not_answer_for_the_hash_that_is_the_failure_of_the_hash(pusher, adr):
    adr.fail_to_connect("resource_show", httpx2.ReadTimeout("timed out"))

    r = await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d", "resourceId": "res-1"})

    assert_failure(r, 500, "Unable to retrieve hash from ADR")


@pytest.mark.parametrize(
    ("language", "detail"),
    [
        ("fr", "Impossible d'obtenir l'empreinte (hash) du fichier à partir d'ADR."),
        ("pt", "Não foi possível obter o hash do arquivo a partir do ADR."),
    ],
)
async def test_the_failure_to_get_the_hash_is_in_the_language_of_the_request(pusher, language, detail):
    r = await pusher.post(
        push_path(OUTPUTS["outputZip"]),
        data={**REQUIRED, "description": "d", "resourceId": "none"},
        headers={"Accept-Language": language},
    )

    assert failure_of(r)["detail"] == detail


# ------------------------------------------------------------------------------------------------ the languages
MESSAGES = {
    "en": [
        "Invalid resourceType",
        "description must be provided for output resourceType",
        "resourceId must be provided for input resourceType",
        "File does not exist",
    ],
    "fr": [
        "Type de ressource non valide (resourceType).",
        "Une description (description) doit être fournie pour un type de ressource de sortie (resourceType).",
        "Un identifiant de ressource (resourceId) doit être fourni pour un type de ressource d'entrée (resourceType).",
        "Le fichier n'existe pas.",
    ],
    "pt": [
        "Tipo de recurso inválido (resourceType).",
        "Uma descrição (description) deve ser fornecida para um tipo de recurso de saída (resourceType).",
        "Um identificador de recurso (resourceId) deve ser fornecido para um tipo de recurso de entrada (resourceType).",
        "O arquivo não existe.",
    ],
}


@pytest.mark.parametrize("language", MESSAGES)
async def test_the_four_refusals_are_in_the_language_of_the_request(pusher, language):
    requests = [
        (push_path("not-a-type"), REQUIRED),
        (push_path(OUTPUTS["outputZip"]), REQUIRED),
        (push_path(INPUTS["pjnz"]), REQUIRED),
        (push_path(INPUTS["pjnz"]), {**REQUIRED, "resourceId": "r"}),
    ]

    details = []
    for path, form in requests:
        r = await pusher.post(path, data=form, headers={"Accept-Language": language})
        assert r.status_code == 400
        details.append(failure_of(r)["detail"])

    assert details == MESSAGES[language]


# ------------------------------------------------------------------------------------------------ files and logs
@pytest.fixture
def temporary_folder(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """The folder for temporary files, which is empty. A temporary file that a push leaves behind is in it."""
    folder = tmp_path / "temporary"
    folder.mkdir()
    monkeypatch.setattr(tempfile, "tempdir", str(folder))
    return folder


def listing(*folders: Path) -> list[str]:
    return sorted(str(path) for folder in folders for path in folder.rglob("*"))


@pytest.mark.parametrize("kind", ["output", "input", "output, adr fails", "input, adr fails", "output, hash"])
async def test_a_push_leaves_no_file_behind_and_changes_no_file(
    pusher, adr, engine, version_id, uploads_dir, results_dir, temporary_folder, kind
):
    await give_input_file(engine, version_id, uploads_dir, "pjnz")
    adr.resources["res-1"] = {"id": "res-1", "hash": "0" * 32}
    before = listing(uploads_dir, results_dir, temporary_folder)
    contents = {path: path.read_bytes() for path in [*uploads_dir.iterdir(), results_dir / OUTPUT_PATH]}
    if "fails" in kind:
        adr.fail("resource_create", ckan_error(500, "boom"))
        adr.fail("resource_patch", ckan_error(500, "boom"))
    path, form = {
        "output": (OUTPUTS["outputZip"], {**REQUIRED, "description": "d"}),
        "output, adr fails": (OUTPUTS["outputZip"], {**REQUIRED, "description": "d"}),
        "output, hash": (OUTPUTS["outputZip"], {**REQUIRED, "description": "d", "resourceId": "res-1"}),
        "input": (INPUTS["pjnz"], {**REQUIRED, "resourceId": "res-1"}),
        "input, adr fails": (INPUTS["pjnz"], {**REQUIRED, "resourceId": "res-1"}),
    }[kind]

    await pusher.post(push_path(path), data=form)

    assert listing(uploads_dir, results_dir, temporary_folder) == before
    assert {path: path.read_bytes() for path in contents} == contents


async def test_a_large_file_is_sent_in_pieces_and_not_read_into_memory(pusher, adr, results_dir):
    size = 8 * 1024 * 1024
    big = b"0123456789abcdef" * (size // 16)
    (results_dir / OUTPUT_PATH).write_bytes(big)

    r = await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d"})

    assert r.status_code == 200
    assert adr.uploads[0].content == big
    assert adr.uploads[0].md5 == md5(big) == r.json()["data"]["hash"]
    [pieces] = adr.body_pieces
    # The body arrives in pieces of a few tens of KB, not as one, and it is all of the file and the form
    assert len(pieces) > size // (128 * 1024)
    assert max(pieces) <= 128 * 1024
    assert sum(pieces) == int(adr.calls[0].headers["Content-Length"]) >= size
    # The length is known, so the body is not sent in chunks
    assert "Transfer-Encoding" not in adr.calls[0].headers


async def test_the_upload_has_a_longer_time_to_wait_for_the_answer_than_the_other_calls(pusher, adr):
    adr.resources["res-1"] = {"id": "res-1", "hash": "0" * 32}

    await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d", "resourceId": "res-1"})

    show, patch = (call.extensions["timeout"] for call in adr.calls)
    assert show == {"connect": 120, "read": 120, "write": 120, "pool": 120}
    assert patch == {"connect": 120, "read": 220, "write": 120, "pool": 120}


async def test_what_could_be_personal_is_not_logged(pusher, adr, caplog):
    """The messages of ADR, the names that the user typed, the descriptions and the files are not logged (the credential
    is checked in every test, see `no_personal_data_in_logs` in tests/conftest.py)."""
    caplog.set_level(logging.DEBUG)
    secret = "Jane Doe's district"
    adr.fail("resource_create", ckan_error(500, f"Cannot take {secret}"))
    adr.fail("dataset_version_create", ckan_error(500, f"Cannot take {secret}"))

    await pusher.post(
        push_path(OUTPUTS["outputZip"]),
        data={"resourceFileName": secret, "resourceName": secret, "description": secret},
    )
    await pusher.post("/adr/datasets/ds/releases", data={"name": secret})
    adr.fail_to_connect("resource_create", httpx2.ReadError("connection dropped"))
    await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": secret})

    assert caplog.records
    assert "Jane Doe" not in caplog.text
    assert CONTENT.decode() not in caplog.text
    assert not [r for r in caplog.records if r.levelno >= logging.ERROR and "Cannot take" in r.getMessage()]


async def test_ckan_replies_that_are_a_success_with_a_result_that_is_not_a_resource_are_still_a_success(pusher, adr):
    # The answer of ADR for a new resource goes on as it is: the Vue app does not read it
    adr.fail("resource_create", ckan_ok({"anything": ["at", "all"]}))

    r = await pusher.post(push_path(OUTPUTS["outputZip"]), data={**REQUIRED, "description": "d"})

    assert r.json() == {"data": {"anything": ["at", "all"]}, "errors": [], "status": "success"}
