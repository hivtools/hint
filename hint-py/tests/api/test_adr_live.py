"""The ADR endpoints against the real dev ADR, as the user of ADR_TEST_KEY.

A fake ADR cannot show that the real ADR still answers in the way that the client expects. These tests show it.

`make test` does not run them. Run them with `make test-adr`. They are skipped if ADR_TEST_KEY is not set. This is the
API key of a test user on the dev ADR. The Kotlin ADR tests and the front end ADR tests use the same variable. The dev
ADR must also accept your IP address: its Front Door only accepts some addresses, because of bots. So these tests fail
on CI for now.

The tests use the dataset `antarctica-country-estimates-2027` in the organisation `naomi-development-team`. It has a
release called `Version 1.0`, an output zip, and a PJNZ, a shape and a population file. The user of the key can be in
other organisations too, so the tests look for this one organisation and do not count them. The tests never write to
ADR. The import tests write to the test database and to a temporary folder, and use the fake hintr.
"""

import hashlib
import os
from collections.abc import AsyncIterator
from pathlib import Path

import httpx2
import pytest
import pytest_asyncio

from app.clients.adr_client import create_adr_http_client
from app.config import Settings
from app.main import app
from app.schemas import FileType
from tests.api.helpers import make_client, version_files
from tests.hintr import FakeHintr
from tests.support import USER

pytestmark = [
    pytest.mark.adr_live,
    pytest.mark.skipif(not os.environ.get("ADR_TEST_KEY"), reason="ADR_TEST_KEY is not set"),
]

DATASET = "antarctica-country-estimates-2027"
ORGANISATION = "naomi-development-team"
RELEASE = "Version 1.0"
OUTPUT_ZIP = "inputs-unaids-naomi-output-zip"
PJNZ = "inputs-unaids-spectrum-file"
SHAPE = "inputs-unaids-geographic"
POPULATION = "inputs-unaids-population"


@pytest_asyncio.fixture
async def live(settings_overrides: dict, caplog: pytest.LogCaptureFixture) -> AsyncIterator[httpx2.AsyncClient]:
    """USER, with the app calling the real ADR (at `adr_url`, the dev ADR) with the key."""
    key = os.environ["ADR_TEST_KEY"]
    settings_overrides["environment"] = "development"
    settings_overrides["adr_api_key"] = key
    app.state.adr_http = create_adr_http_client(Settings(environment="development"))
    async with make_client(USER) as client:
        yield client
    await app.state.adr_http.aclose()
    assert key not in caplog.text, "the key of ADR is in the log"


def datasets_named(response: httpx2.Response, name: str) -> list[dict]:
    assert response.status_code == 200, response.text
    return [dataset for dataset in response.json()["data"] if dataset["name"] == name]


async def test_the_input_datasets_have_the_test_dataset_with_its_files(live):
    [dataset] = datasets_named(await live.get("/adr/datasets", params={"type": "input"}), DATASET)

    assert dataset["type"] == "country-estimates-27"
    assert dataset["resources"]
    assert all({"id", "resource_type", "url"} <= set(resource) for resource in dataset["resources"])


async def test_the_output_datasets_have_the_test_dataset_with_its_output_zip(live):
    r = await live.get("/adr/datasets", params={"type": "output"})

    [dataset] = datasets_named(r, DATASET)
    assert any(resource["resource_type"] == OUTPUT_ZIP for resource in dataset["resources"])


async def test_a_dataset_is_what_adr_has(live):
    r = await live.get(f"/adr/datasets/{DATASET}")

    assert r.status_code == 200, r.text
    assert r.json()["status"] == "success"
    assert r.json()["data"]["name"] == DATASET
    assert r.json()["data"]["organization"]["name"] == ORGANISATION


async def test_a_dataset_that_does_not_exist_is_an_error_of_adr(live):
    r = await live.get("/adr/datasets/no-such-dataset-for-this-test")

    assert r.status_code == 500
    assert r.json()["status"] == "failure"
    assert r.json()["errors"][0]["error"] == "ADR_ERROR"


async def test_the_dataset_has_its_release(live):
    r = await live.get(f"/adr/datasets/{DATASET}/releases")

    assert r.status_code == 200, r.text
    releases = r.json()["data"]
    assert RELEASE in [release["name"] for release in releases]
    assert all("id" in release for release in releases)


async def test_a_dataset_as_it_was_at_the_release(live):
    r = await live.get(f"/adr/datasets/{DATASET}", params={"release": RELEASE})

    assert r.status_code == 200, r.text
    resources = r.json()["data"]["resources"]
    assert resources
    # The url of a resource in a release is the url of the file as it was at that release.
    assert all("?activity_id=" in resource["url"] for resource in resources)


async def test_the_output_releases_are_some_of_the_releases(live):
    everything = (await live.get(f"/adr/datasets/{DATASET}/releases")).json()["data"]

    r = await live.get(f"/adr/datasets/{DATASET}/releases", params={"type": "output"})

    assert r.status_code == 200, r.text
    assert {release["id"] for release in r.json()["data"]} <= {release["id"] for release in everything}


async def test_the_organisations_of_the_user_have_the_one_of_the_test_dataset(live):
    r = await live.get("/adr/orgs", params={"permission": "update_dataset"})

    assert r.status_code == 200, r.text
    assert ORGANISATION in [org["name"] for org in r.json()["data"]]


# ---- Importing a file


@pytest_asyncio.fixture
async def live_importer(
    live: httpx2.AsyncClient, version_id: str, hintr: FakeHintr, uploads_dir: Path
) -> AsyncIterator[httpx2.AsyncClient]:
    """USER on a version, with the app calling the real ADR. hintr is the fake hintr, which says that each file is valid."""
    async with make_client(USER, version_id) as client:
        yield client


async def resource_of(client: httpx2.AsyncClient, resource_type: str) -> dict:
    r = await client.get(f"/adr/datasets/{DATASET}")
    assert r.status_code == 200, r.text
    [resource] = [res for res in r.json()["data"]["resources"] if res["resource_type"] == resource_type]
    return {"url": resource["url"], "datasetId": r.json()["data"]["id"], "resourceId": resource["id"]}


@pytest.mark.parametrize(
    ("file_type", "resource_type"),
    [("pjnz", PJNZ), ("shape", SHAPE), ("population", POPULATION)],
)
async def test_an_input_file_is_imported_from_adr(
    live_importer, engine, version_id, uploads_dir, file_type, resource_type
):
    resource = await resource_of(live_importer, resource_type)

    r = await live_importer.post(f"/adr/{file_type}", json=resource)

    assert r.status_code == 200, r.text
    file_hash, filename, from_adr, resource_url = (await version_files(engine, version_id))[file_type]
    content = (uploads_dir / file_hash).read_bytes()
    assert content
    assert file_hash.split(".")[0] == hashlib.md5(content, usedforsecurity=False).hexdigest().upper()
    assert filename == resource["url"].rsplit("/", 1)[-1]
    assert from_adr
    expected = f"{Settings().adr_url}dataset/{resource['datasetId']}/resource/{resource['resourceId']}/download/"
    assert (resource_url or "").startswith(f"{expected}{filename}?activity_id=")


async def test_the_credential_goes_to_adr_and_not_to_its_storage(live_importer):
    resource = await resource_of(live_importer, PJNZ)
    seen: list[tuple[str, bool]] = []

    async def record(request: httpx2.Request) -> None:
        seen.append((request.url.host, "Authorization" in request.headers))

    app.state.adr_http.event_hooks["request"].append(record)

    r = await live_importer.post("/adr/pjnz", json=resource)

    assert r.status_code == 200, r.text
    adr_host = httpx2.URL(Settings().adr_url).host
    # The download, which ADR redirects to its storage, then the activities of the dataset
    assert seen[0] == (adr_host, True)
    assert any(host != adr_host and not sent for host, sent in seen)
    assert all(sent for host, sent in seen if host == adr_host)
    assert not any(sent for host, sent in seen if host != adr_host)


async def test_a_file_bigger_than_the_limit_is_refused_as_it_is_downloaded(live_importer, upload_limits, uploads_dir):
    # The storage of ADR does not say how big the file is, so the download is counted as it arrives
    upload_limits(100 * 1024, FileType.PJNZ)

    r = await live_importer.post("/adr/pjnz", json=await resource_of(live_importer, PJNZ))

    assert r.status_code == 413, r.text
    assert r.json()["errors"][0]["error"] == "FILE_TOO_LARGE"
    assert list(uploads_dir.iterdir()) == []
