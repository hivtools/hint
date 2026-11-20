"""The endpoints that import an input file from ADR into the user's version (`POST /adr/pjnz` and the others, in
app/routers/adr.py, and through them app/services/adr_imports.py).

An import is an upload of a file that comes from ADR, so these tests check what is different: where the file comes
from, who ADR sees, what is refused before the download, and the size limit on the download. What happens to a stored
file (hashing, storage, validation) is in tests/api/test_input_files.py.

ADR is the fake ADR of tests/adr.py, and hintr is the fake hintr of tests/hintr.py.
"""

import hashlib
import json
import logging
from collections.abc import AsyncIterator
from pathlib import Path

import httpx2
import pytest
import pytest_asyncio

from app.main import app
from app.schemas import FileType
from tests.adr import STORAGE, FakeAdr, ckan_error, download_link, file_response
from tests.api.helpers import add_files, assert_failure, known_hashes, make_client, version_files
from tests.hintr import SUCCESS
from tests.support import ADR_KEY, USER

BASELINE = ["pjnz", "shape", "population"]
DISEASE = ["survey", "programme", "anc"]
NAMES = {**dict.fromkeys([*BASELINE, *DISEASE], "data.csv"), "pjnz": "data.PJNZ", "shape": "data.geojson"}

CONTENT = b"abc"
# The upper case MD5 of "abc"
ABC = "900150983CD24FB0D6963F7D28E17F72"
LINK = download_link("d-input-1", "r1", "data.PJNZ")
# The link to keep with the file: the download link at the newest activity of the dataset (see tests/adr.py)
RESOURCE_URL = f"{LINK}?activity_id=act-new"


def body(link: str = LINK, dataset_id: str | None = "d-input-1", resource_id: str | None = "r1") -> dict:
    return {"url": link, "datasetId": dataset_id, "resourceId": resource_id}


def stored_as(name: str, content: bytes = CONTENT) -> str:
    return f"{hashlib.md5(content, usedforsecurity=False).hexdigest().upper()}.{name.rsplit('.', 1)[-1]}"


def sent_to_hintr(hintr) -> list[dict]:
    return [json.loads(call.content) for call in hintr.calls]


@pytest_asyncio.fixture
async def importer(
    adr: FakeAdr, hintr, settings_overrides: dict, uploads_dir: Path, version_id: str
) -> AsyncIterator[httpx2.AsyncClient]:
    """USER on a version, in development, where ADR is called with the key of the settings. ADR is the fake ADR, at
    https://adr.example/."""
    settings_overrides["environment"] = "development"
    settings_overrides["adr_api_key"] = ADR_KEY
    async with make_client(USER, version_id) as client:
        yield client


async def import_file(client: httpx2.AsyncClient, file_type: str, **kwargs) -> httpx2.Response:
    return await client.post(f"/adr/{file_type}", **kwargs)


# ---- A file that is imported


@pytest.mark.parametrize("file_type", [*BASELINE, *DISEASE])
async def test_an_imported_file_is_stored_recorded_as_from_adr_and_validated(
    importer, adr, hintr, engine, version_id, uploads_dir, file_type
):
    if file_type in DISEASE:
        await add_files(engine, version_id, "pjnz", "shape")
    link = download_link("d-input-1", "r1", NAMES[file_type])
    adr.serve(link, CONTENT)

    r = await import_file(importer, file_type, json=body(link))

    # The answer is hintr's, as for an upload
    assert r.status_code == 200
    assert r.content == SUCCESS
    name = stored_as(NAMES[file_type])
    assert (uploads_dir / name).read_bytes() == CONTENT
    assert name in await known_hashes(engine)
    assert (await version_files(engine, version_id))[file_type] == (
        name,
        NAMES[file_type],
        True,
        f"{link}?activity_id=act-new",
    )
    [sent] = sent_to_hintr(hintr)
    assert sent["file"] == {
        "path": f"{uploads_dir}/{name}",
        "hash": name,
        "filename": NAMES[file_type],
        "fromADR": True,
        "resource_url": f"{link}?activity_id=act-new",
    }
    if file_type in DISEASE:
        assert sent["shape"] == f"{uploads_dir}/shape123"


async def test_a_failed_validation_is_answered_and_the_imported_file_is_kept(importer, adr, hintr, engine, version_id):
    adr.serve(LINK, CONTENT)
    hintr.answer(400, json={"status": "failure", "errors": [{"error": "INVALID_FILE", "detail": "bad"}], "data": {}})

    r = await import_file(importer, "pjnz", json=body())

    assert r.status_code == 400
    assert r.json()["errors"][0]["error"] == "INVALID_FILE"
    assert (await version_files(engine, version_id))["pjnz"][0] == stored_as("data.PJNZ")


async def test_a_disease_file_without_a_shape_file_is_kept_and_the_user_is_told(
    importer, adr, hintr, engine, version_id
):
    link = download_link("d-input-1", "r1", "anc.csv")
    adr.serve(link, CONTENT)

    r = await import_file(importer, "anc", json=body(link))

    assert_failure(r, 400, "You must upload a shape file before uploading survey or programme data.")
    assert (await version_files(engine, version_id))["anc"] == (
        stored_as("anc.csv"),
        "anc.csv",
        True,
        f"{link}?activity_id=act-new",
    )
    assert hintr.calls == []


async def test_the_file_is_downloaded_as_the_user_and_the_credential_stays_with_adr(importer, adr):
    adr.serve(LINK, CONTENT)

    await import_file(importer, "pjnz", json=body())

    first, storage = adr.downloads()
    assert str(first.url) == LINK
    assert first.headers["Authorization"] == ADR_KEY
    # ADR redirects to its storage, which is on another address. The credential does not go there.
    assert str(storage.url).startswith(STORAGE)
    assert "Authorization" not in storage.headers


async def test_a_link_with_a_query_is_downloaded_with_it_and_the_name_has_no_query(importer, adr, engine, version_id):
    adr.serve(LINK, CONTENT)

    r = await import_file(importer, "pjnz", json=body(f"{LINK}?activity_id=abc&x=1"))

    assert r.status_code == 200
    assert str(adr.downloads()[0].url) == f"{LINK}?activity_id=abc&x=1"
    assert (await version_files(engine, version_id))["pjnz"][1] == "data.PJNZ"


@pytest.mark.parametrize(
    "address",
    ["https://dev-adr.example/", "https://evil.example/", "http://adr.example:8443/", "https://user@adr.example/"],
)
async def test_a_link_with_another_host_is_downloaded_from_adr_with_the_credential(importer, adr, address):
    adr.serve(LINK, CONTENT)

    r = await import_file(importer, "pjnz", json=body(download_link("d-input-1", "r1", "data.PJNZ", address)))

    assert r.status_code == 200
    first, storage = adr.downloads()
    assert (str(first.url), first.headers["Authorization"]) == (LINK, ADR_KEY)
    assert str(storage.url).startswith(STORAGE)


@pytest.mark.parametrize(
    "fields",
    [
        {"resourceId": None},
        {"resourceId": ""},
        {"datasetId": None},
        {"datasetId": ""},
        {"datasetId": None, "resourceId": None},
    ],
)
async def test_without_both_ids_the_file_has_an_empty_resource_url_and_adr_is_not_asked(
    importer, adr, engine, version_id, fields
):
    adr.serve(LINK, CONTENT)

    r = await import_file(importer, "pjnz", json={**body(), **fields})

    assert r.status_code == 200
    assert (await version_files(engine, version_id))["pjnz"][3] == ""
    assert adr.queries("package_activity_list") == []


async def test_the_ids_may_be_left_out(importer, adr, engine, version_id):
    adr.serve(LINK, CONTENT)

    r = await import_file(importer, "pjnz", json={"url": LINK, "unknown": 1})

    assert r.status_code == 200
    assert (await version_files(engine, version_id))["pjnz"][2:] == (True, "")


@pytest.mark.parametrize(
    "answer",
    [
        ckan_error(500, "x", "Internal Error"),
        httpx2.Response(200, text="garbage"),
        httpx2.Response(200, json={"success": True, "result": []}),
        httpx2.Response(200, json={"success": True, "result": [{"no": "id"}]}),
        httpx2.Response(200, json={"success": True, "result": ["not an activity"]}),
        httpx2.Response(200, json={"success": True, "result": {"not": "a list"}}),
    ],
)
async def test_without_the_activities_of_the_dataset_the_file_has_an_empty_resource_url(
    importer, adr, engine, version_id, answer
):
    adr.serve(LINK, CONTENT)
    adr.fail("package_activity_list", answer)

    r = await import_file(importer, "pjnz", json=body())

    assert r.status_code == 200
    assert (await version_files(engine, version_id))["pjnz"][3] == ""


async def test_without_an_answer_to_the_activities_the_file_has_an_empty_resource_url(
    importer, adr, engine, version_id
):
    adr.serve(LINK, CONTENT)
    adr.fail_to_connect("package_activity_list", httpx2.ConnectError("refused"))

    r = await import_file(importer, "pjnz", json=body())

    assert r.status_code == 200
    assert (await version_files(engine, version_id))["pjnz"][3] == ""


# ---- What is refused before the download


@pytest.mark.parametrize(
    "link",
    [
        "ftp://adr.example/data.PJNZ",
        "/dataset/d-input-1/resource/r1/download/data.PJNZ",
        "not a url",
        "",
        "http://[adr.example/data.PJNZ",
        "https://adr.example/data\x01.PJNZ",
    ],
)
async def test_a_link_that_is_not_an_http_address_is_refused_and_nothing_changes(
    importer, adr, engine, version_id, link
):
    await add_files(engine, version_id, "pjnz")

    r = await import_file(importer, "pjnz", json=body(link))

    assert_failure(r, 400, f"This link does not lead to ADR, so the file cannot be imported: {link}")
    assert adr.calls == []
    assert (await version_files(engine, version_id))["pjnz"][0] == "pjnz123"


@pytest.mark.parametrize(
    "link",
    ["https://adr.example/dataset/d-input-1/resource/r1/download/data.PJNZ", "https://adr.example/adrian/data.PJNZ"],
)
async def test_a_link_whose_path_is_not_under_the_path_of_adr_is_refused_and_nothing_changes(
    importer, adr, engine, version_id, monkeypatch, link
):
    """The address of ADR can have a path, as the ADR stub of the dev stack has."""
    monkeypatch.setattr(app.state, "adr_http", adr.http_at("https://adr.example/adr/"))
    await add_files(engine, version_id, "pjnz")

    r = await import_file(importer, "pjnz", json=body(link))

    assert_failure(r, 400, f"This link does not lead to ADR, so the file cannot be imported: {link}")
    assert adr.calls == []
    assert (await version_files(engine, version_id))["pjnz"][0] == "pjnz123"


async def test_a_link_under_the_path_of_adr_is_imported_from_it(importer, adr, monkeypatch, uploads_dir):
    monkeypatch.setattr(app.state, "adr_http", adr.http_at("https://adr.example/adr/"))
    link = download_link("d-input-1", "r1", "data.PJNZ", address="https://adr.example/adr/")
    adr.serve(link, CONTENT)

    r = await import_file(importer, "pjnz", json=body(link))

    assert r.status_code == 200, r.text
    assert str(adr.downloads()[0].url) == link


async def test_a_link_that_is_not_an_http_address_is_refused_in_the_language_of_the_request(importer, adr):
    r = await import_file(importer, "pjnz", json=body("ftp://adr.example/x.PJNZ"), headers={"Accept-Language": "fr"})

    assert_failure(
        r, 400, "Ce lien ne mène pas à ADR, le fichier ne peut donc pas être importé : ftp://adr.example/x.PJNZ"
    )


@pytest.mark.parametrize(
    ("file_type", "filename", "got"),
    [
        ("pjnz", "shape.geojson", "geojson"),
        ("shape", "areas.shp", "shp"),
        ("anc", "anc.xlsx", "xlsx"),
        ("pjnz", "", ""),
    ],
)
async def test_a_file_of_another_kind_is_refused_before_it_is_downloaded(
    importer, adr, engine, version_id, uploads_dir, file_type, filename, got
):
    await add_files(engine, version_id, file_type)
    link = download_link("d-input-1", "r1", filename)
    adr.serve(link, CONTENT)

    r = await import_file(importer, file_type, json=body(link))

    assert r.status_code == 400
    [error] = r.json()["errors"]
    assert error["error"] == "INVALID_FILE_EXTENSION"
    assert error["detail"].endswith(f"got type {got}.")
    assert adr.calls == []
    assert list(uploads_dir.iterdir()) == []
    # The version's file of that type is taken off, as for an upload
    assert file_type not in await version_files(engine, version_id)


async def test_an_import_needs_a_login(importer, adr):
    async with make_client("guest") as guest:
        r = await guest.post("/adr/pjnz", json=body())

    assert_failure(r, 401, "Login required")
    assert adr.calls == []


async def test_an_import_needs_a_credential_for_adr(importer, adr, settings_overrides, engine, version_id):
    settings_overrides["adr_api_key"] = None
    await add_files(engine, version_id, "pjnz")

    r = await import_file(importer, "pjnz", json=body())

    assert r.status_code == 400
    assert r.json()["errors"][0]["detail"].startswith("Could not find your ADR credentials.")
    assert adr.calls == []
    assert (await version_files(engine, version_id))["pjnz"][0] == "pjnz123"


@pytest.mark.parametrize("request_body", [None, {}, {"datasetId": "d"}, {"url": None}, {"url": 5}])
async def test_a_body_without_a_link_is_a_bad_request(importer, adr, request_body):
    r = await import_file(importer, "pjnz", json=request_body)

    assert r.status_code == 400
    assert r.json()["errors"][0]["detail"].startswith("An unexpected error occurred.")
    assert adr.calls == []


# ---- The size limit


@pytest.mark.parametrize("chunked", [False, True], ids=["with its size", "without its size"])
async def test_a_file_bigger_than_the_limit_of_its_type_is_refused_and_nothing_changes(
    importer, adr, upload_limits, engine, version_id, uploads_dir, chunked
):
    upload_limits(1024 * 1024, FileType.PJNZ)
    await add_files(engine, version_id, "pjnz")
    adr.serve(LINK, b"x" * (1024 * 1024 + 1), chunked=chunked)

    r = await import_file(importer, "pjnz", json=body())

    assert r.status_code == 413
    assert r.json()["errors"] == [
        {"error": "FILE_TOO_LARGE", "detail": "The file is too large. Files can be up to 1 MB."}
    ]
    assert list(uploads_dir.iterdir()) == []
    assert (await version_files(engine, version_id))["pjnz"][0] == "pjnz123"


@pytest.mark.parametrize("chunked", [False, True], ids=["with its size", "without its size"])
async def test_a_file_at_the_limit_is_imported(importer, adr, upload_limits, uploads_dir, chunked):
    upload_limits(10, FileType.PJNZ)
    adr.serve(LINK, b"x" * 10, chunked=chunked)

    r = await import_file(importer, "pjnz", json=body())

    assert r.status_code == 200
    assert (uploads_dir / stored_as("data.PJNZ", b"x" * 10)).read_bytes() == b"x" * 10


async def test_the_limit_is_the_one_of_the_type_of_file(importer, adr, upload_limits, uploads_dir):
    upload_limits(2, FileType.SHAPE)
    upload_limits(3, FileType.PJNZ)
    adr.serve(LINK, CONTENT)

    r = await import_file(importer, "pjnz", json=body())

    assert r.status_code == 200


# ---- ADR does not give the file


@pytest.mark.parametrize(
    ("adr_status", "status"), [(404, 404), (403, 403), (401, 401), (500, 500), (503, 503), (204, 500)]
)
async def test_a_file_that_adr_does_not_give_is_an_error_with_its_link_and_nothing_changes(
    importer, adr, engine, version_id, uploads_dir, adr_status, status
):
    await add_files(engine, version_id, "pjnz")
    adr.answer(LINK, httpx2.Response(adr_status, text="no"))

    r = await import_file(importer, "pjnz", json=body())

    assert_failure(r, status, f"Unable to load resource, check resource in ADR {LINK}.")
    assert list(uploads_dir.iterdir()) == []
    assert (await version_files(engine, version_id))["pjnz"][0] == "pjnz123"


@pytest.mark.parametrize(
    ("language", "detail"),
    [
        ("fr", f"Impossible de charger la ressource, vérifiez la ressource dans ADR {LINK}."),
        ("pt", f"Não é possível carregar o recurso, verifique o recurso no ADR {LINK}."),
    ],
)
async def test_a_file_that_adr_does_not_give_is_an_error_in_the_language_of_the_request(
    importer, adr, language, detail
):
    r = await import_file(importer, "pjnz", json=body(), headers={"Accept-Language": language})

    assert_failure(r, 404, detail)


async def test_a_login_page_in_place_of_the_file_means_the_user_may_not_see_it(
    importer, adr, engine, version_id, uploads_dir
):
    await add_files(engine, version_id, "pjnz")
    adr.redirect(LINK, "/user/login")
    adr.answer("https://adr.example/user/login", httpx2.Response(200, html="<html><title>login</title></html>"))

    r = await import_file(importer, "pjnz", json=body())

    assert_failure(
        r, 403, "You do not have permission to load this resource from ADR. Contact dataset admin for permission."
    )
    assert list(uploads_dir.iterdir()) == []
    assert (await version_files(engine, version_id))["pjnz"][0] == "pjnz123"


async def test_no_answer_from_adr_is_an_error_and_nothing_changes(importer, adr, engine, version_id, uploads_dir):
    await add_files(engine, version_id, "pjnz")
    adr.fail_to_download(LINK, httpx2.ConnectError("refused"))

    r = await import_file(importer, "pjnz", json=body())

    assert_failure(r, 500, "No response returned. The request may have timed out.")
    assert list(uploads_dir.iterdir()) == []
    assert (await version_files(engine, version_id))["pjnz"][0] == "pjnz123"


async def test_the_file_is_not_in_the_log(importer, adr, caplog):
    caplog.set_level(logging.INFO)
    adr.serve(LINK, b"secret,content")

    await import_file(importer, "pjnz", json=body())

    assert "secret,content" not in caplog.text


async def test_the_imported_file_replaces_an_uploaded_one(importer, adr, hintr, engine, version_id):
    await add_files(engine, version_id, "pjnz")
    adr.serve(LINK, CONTENT)

    await import_file(importer, "pjnz", json=body())

    assert (await version_files(engine, version_id))["pjnz"] == (
        stored_as("data.PJNZ"),
        "data.PJNZ",
        True,
        RESOURCE_URL,
    )


async def test_a_chunked_file_is_stored_whole(importer, adr, uploads_dir):
    content = b"0123456789" * 7
    adr.serve(LINK, content, chunked=True)

    r = await import_file(importer, "pjnz", json=body())

    assert r.status_code == 200
    assert (uploads_dir / stored_as("data.PJNZ", content)).read_bytes() == content


async def test_a_file_bigger_than_memory_is_stored_whole(importer, adr, uploads_dir, monkeypatch):
    monkeypatch.setattr("app.clients.adr_client.IN_MEMORY_BYTES", 8)
    content = b"0123456789" * 7
    adr.answer(LINK, file_response(content, chunked=True))

    r = await import_file(importer, "pjnz", json=body())

    assert r.status_code == 200
    assert (uploads_dir / stored_as("data.PJNZ", content)).read_bytes() == content
