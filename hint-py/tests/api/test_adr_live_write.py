"""Pushing to the real dev ADR. THESE TESTS WRITE TO ADR, so they are skipped unless someone asks for them on purpose.

They need two things, and both must be set:

- `ADR_TEST_KEY`: the API key of a test user on the dev ADR (as for the other live tests, see test_adr_live.py);
- `HINT_ADR_TEST_WRITE_DATASET`: the name of a scratch dataset that the user of the key may change, and that nobody else
  uses. Do not use a dataset that people work on: these tests make releases on it, and delete the release of any name
  that they use again.

Nothing sets either of them for `make test`, `make test-adr` or CI. Run them by hand with
`HINT_ADR_TEST_WRITE_DATASET=<dataset> make test-adr` after checking the dataset. They leave what they made on the
dataset: a release and a resource for each run (this API cannot delete a resource, and a release can only be deleted by
making another with the same name). The names have the time of the run, so runs do not meet.
"""

import os
import time
from collections.abc import AsyncIterator
from pathlib import Path

import httpx2
import pytest
import pytest_asyncio

from app.clients.adr_client import create_adr_http_client
from app.config import Settings
from app.main import app
from app.schemas import FileType
from app.services.file_types import INPUT_FILE_TYPES, OUTPUT_SUMMARY
from tests.api.helpers import add_files, make_client
from tests.hintr import FakeHintr, success
from tests.support import USER

pytestmark = [
    pytest.mark.adr_live,
    pytest.mark.skipif(not os.environ.get("ADR_TEST_KEY"), reason="ADR_TEST_KEY is not set"),
    pytest.mark.skipif(
        not os.environ.get("HINT_ADR_TEST_WRITE_DATASET"), reason="HINT_ADR_TEST_WRITE_DATASET is not set"
    ),
]

PJNZ = INPUT_FILE_TYPES[FileType.PJNZ].adr_resource_type
METADATA = {
    "id": "t1",
    "areas": "MWI",
    "type": "summary",
    "file_label": "summary-report",
    "file_extension": ".html",
    "description": "Summary",
}


@pytest_asyncio.fixture
async def live(
    settings_overrides: dict,
    uploads_dir: Path,
    version_id: str,
    engine,
    hintr: FakeHintr,
    caplog: pytest.LogCaptureFixture,
) -> AsyncIterator[httpx2.AsyncClient]:
    """USER on a version that has a PJNZ file, with the app calling the real ADR as the user of the key."""
    key = os.environ["ADR_TEST_KEY"]
    settings_overrides["environment"] = "development"
    settings_overrides["adr_api_key"] = key
    # On CI, the dev ADR lets the runner in only with this secret (see `adr_waf_bypass_secret`)
    waf_secret = os.environ.get("ADR_WAF_BYPASS_SECRET")
    app.state.adr_http = create_adr_http_client(
        Settings(environment="development", adr_waf_bypass_secret=waf_secret or None)
    )
    await add_files(engine, version_id, "pjnz")
    (uploads_dir / "pjnz123").write_bytes(f"a test file made at {time.time()}".encode())
    async with make_client(USER, version_id) as client:
        yield client
    await app.state.adr_http.aclose()
    assert key not in caplog.text, "the key of ADR is in the log"
    assert not waf_secret or waf_secret not in caplog.text, "the bypass secret of ADR is in the log"


async def test_a_release_with_a_name_that_is_used_replaces_the_old_release(live):
    dataset = os.environ["HINT_ADR_TEST_WRITE_DATASET"]
    name = f"hint-py test {int(time.time())}"
    path = f"/adr/datasets/{dataset}/releases"

    first = await live.post(path, data={"name": name})
    second = await live.post(path, data={"name": name})
    listed = await live.get(path)

    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    assert [release["name"] for release in listed.json()["data"]].count(name) == 1
    assert second.json()["data"]["id"] != first.json()["data"]["id"]


async def test_an_output_is_a_new_resource_and_an_input_file_replaces_it_only_if_it_differs(
    live, results_dir, hintr: FakeHintr
):
    dataset = os.environ["HINT_ADR_TEST_WRITE_DATASET"]
    summary = OUTPUT_SUMMARY.adr_resource_type
    (results_dir / "t1").mkdir()
    (results_dir / "t1" / "report.html").write_bytes(f"<html>a test report made at {time.time()}</html>".encode())
    hintr.answer(200, json=success({"path": "t1/report.html", "metadata": METADATA}))
    name = f"hint-py test {int(time.time())}"
    form = {"resourceFileName": "report.html", "resourceName": name, "description": "A test of hint-py"}

    created = await live.post(f"/adr/datasets/{dataset}/resource/{summary}/t1", data=form)
    assert created.status_code == 200, created.text
    resource_id = created.json()["data"]["id"]

    # The same file again: ADR has its hash, so nothing is sent
    same = await live.post(f"/adr/datasets/{dataset}/resource/{summary}/t1", data={**form, "resourceId": resource_id})
    assert same.json() == {"data": True, "errors": [], "status": "success"}

    # The PJNZ file of the version is another file: it replaces the file of the resource. (The resource type of the call
    # is the one that ADR stores for the resource, here the PJNZ type.)
    replaced = await live.post(
        f"/adr/datasets/{dataset}/resource/{PJNZ}/not-used",
        data={"resourceFileName": "ignored", "resourceName": name, "resourceId": resource_id},
    )
    assert replaced.status_code == 200, replaced.text
    assert replaced.json()["data"]["id"] == resource_id
    assert replaced.json()["data"]["hash"] != created.json()["data"]["hash"]
