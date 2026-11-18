"""The ADR endpoints against the real dev ADR, as the user of ADR_TEST_KEY.

A fake ADR cannot show that the real ADR still answers in the way that the client expects. These tests show it.

`make test` does not run them. Run them with `make test-adr`. They are skipped if ADR_TEST_KEY is not set. This is the
API key of a test user on the dev ADR. The Kotlin ADR tests and the front end ADR tests use the same variable. The dev
ADR must also accept your IP address: its Front Door only accepts some addresses, because of bots. So these tests fail
on CI for now.

The tests use the dataset `antarctica-country-estimates-2027` in the organisation `naomi-development-team`. It has a
release called `Version 1.0` and an output zip. The user of the key can be in other organisations too, so the tests look
for this one organisation and do not count them. The tests never write to ADR.
"""

import os
from collections.abc import AsyncIterator

import httpx2
import pytest
import pytest_asyncio
from pydantic import SecretStr

from app.clients.adr_client import create_adr_http_client
from app.config import Settings
from app.main import create_app
from tests.api.helpers import make_client
from tests.support import USER

pytestmark = [
    pytest.mark.adr_live,
    pytest.mark.skipif(not os.environ.get("ADR_TEST_KEY"), reason="ADR_TEST_KEY is not set"),
]

DATASET = "antarctica-country-estimates-2027"
ORGANISATION = "naomi-development-team"
RELEASE = "Version 1.0"
OUTPUT_ZIP = "inputs-unaids-naomi-output-zip"


@pytest_asyncio.fixture
async def live(caplog: pytest.LogCaptureFixture) -> AsyncIterator[httpx2.AsyncClient]:
    """USER, with an app calling the real ADR (at `adr_url`, the dev ADR) with the key. It needs no database."""
    key = os.environ["ADR_TEST_KEY"]
    settings = Settings(environment="development", adr_api_key=SecretStr(key))
    async with (
        create_adr_http_client(settings) as adr_http,
        make_client(create_app(settings, adr_http=adr_http), USER) as client,
    ):
        yield client
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
