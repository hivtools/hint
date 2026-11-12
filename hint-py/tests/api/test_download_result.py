"""GET /download/result/{id} (app/routers/downloads.py): the file of a finished download, sent from the results folder.

hintr only says where the file is and what it is. What the client does with hintr's answer is in
tests/clients/test_hintr_client.py.
"""

import logging
import re
from datetime import UTC, datetime
from pathlib import Path

import pytest

from app.routers.downloads import download_filename
from app.schemas import DownloadMetadata
from tests.hintr import HINTR_FAILURE, failure, success

CONTENT = b"PK\x03\x04 pretend this is a zip"
METADATA = {
    "id": "t1",
    "areas": "MWI",
    "type": "summary",
    "file_label": "summary-report",
    "file_extension": ".html",
    "description": "Summary report",
}


@pytest.fixture
def download(results_dir, hintr):
    """A file in the results folder, which hintr says is the download t1."""
    folder = results_dir / "t1"
    folder.mkdir()
    (folder / "summary.html").write_bytes(CONTENT)
    hintr.answer(200, json=success({"path": "t1/summary.html", "metadata": METADATA}))
    return results_dir


async def test_the_file_is_sent_as_a_download(anonymous_client, download):
    r = await anonymous_client.get("/download/result/t1")

    assert r.status_code == 200
    assert r.content == CONTENT
    assert r.headers["content-type"] == "application/octet-stream"
    assert r.headers["content-length"] == str(len(CONTENT))
    assert re.fullmatch(
        r'attachment; filename="MWI_summary-report_\d{8}-\d{4}\.html"', r.headers["content-disposition"]
    )


async def test_no_identity_or_version_is_needed(anonymous_client, download):
    # Guests download too, and the browser's request for the link has no X-Version-Id
    assert (await anonymous_client.get("/download/result/t1")).status_code == 200


async def test_hintr_is_asked_where_the_file_is_not_to_send_it(anonymous_client, download, hintr):
    await anonymous_client.get("/download/result/a%3Fb", headers={"Accept-Language": "pt"})

    assert [(c.method, c.url.raw_path) for c in hintr.calls] == [("GET", b"/download/result/path/a%3Fb")]
    assert hintr.calls[0].headers["Accept-Language"] == "pt"


async def test_part_of_the_file_can_be_asked_for(anonymous_client, download):
    r = await anonymous_client.get("/download/result/t1", headers={"Range": "bytes=3-6"})

    assert r.status_code == 206
    assert r.content == CONTENT[3:7]
    assert r.headers["content-range"] == f"bytes 3-6/{len(CONTENT)}"


async def test_a_big_file_is_sent_whole(anonymous_client, download):
    """Sent in pieces, not read into memory, but the browser gets all of it."""
    big = b"0123456789abcdef" * 1024 * 1024  # 16 MiB
    (download / "t1" / "summary.html").write_bytes(big)

    r = await anonymous_client.get("/download/result/t1")

    assert r.headers["content-length"] == str(len(big))
    assert r.content == big


@pytest.mark.parametrize(("status", "body"), [(400, HINTR_FAILURE), (404, HINTR_FAILURE)])
async def test_a_failure_of_hintr_comes_back_as_it_is(anonymous_client, download, hintr, status, body):
    # The task does not exist, did not finish, or is not a download
    hintr.answer(status, json=body)

    r = await anonymous_client.get("/download/result/t1")

    assert r.status_code == status
    assert r.json() == body


async def test_no_answer_from_hintr_is_a_failure(anonymous_client, download, hintr):
    hintr.answer(503, content=b"Service Unavailable", headers={"Content-Type": "text/plain"})
    r = await anonymous_client.get("/download/result/t1")
    assert r.status_code == 500
    assert r.json() == failure("Could not parse response.")


async def test_a_file_that_is_not_in_the_folder_is_an_unexpected_error(anonymous_client, download, hintr, caplog):
    (download / "t1" / "summary.html").unlink()

    with caplog.at_level(logging.ERROR):
        r = await anonymous_client.get("/download/result/t1")

    assert r.status_code == 500
    assert r.json()["errors"][0]["detail"].startswith("An unexpected error occurred")
    # What is missing is in the log. The path is as the operating system writes it (backslashes on Windows).
    [missing] = [r for r in caplog.records if r.getMessage().startswith("Result file missing")]
    assert missing.path.endswith(str(Path("t1", "summary.html")))
    assert missing.task == "t1"


async def test_a_path_that_leads_out_of_the_results_folder_is_not_sent(anonymous_client, download, hintr, tmp_path):
    (tmp_path / "secret.txt").write_bytes(b"secret")
    hintr.answer(200, json=success({"path": "../secret.txt", "metadata": METADATA}))

    r = await anonymous_client.get("/download/result/t1")

    assert r.status_code == 500
    assert b"secret" not in r.content


async def test_a_folder_is_not_sent(anonymous_client, download, hintr):
    hintr.answer(200, json=success({"path": "t1", "metadata": METADATA}))
    assert (await anonymous_client.get("/download/result/t1")).status_code == 500


async def test_an_answer_from_hintr_that_is_not_a_download_is_an_unexpected_error(anonymous_client, download, hintr):
    hintr.answer(200, json=success({"path": "t1/summary.html"}))
    r = await anonymous_client.get("/download/result/t1")
    assert r.status_code == 500
    assert r.json()["errors"][0]["detail"].startswith("An unexpected error occurred")


@pytest.mark.parametrize(
    ("metadata", "expected"),
    [
        (("MWI", "summary-report", ".html"), "MWI_summary-report_20251112-1030.html"),
        (("MWI", "naomi-output", ".zip"), "MWI_naomi-output_20251112-1030.zip"),
        (("MWI_1_2", "pepfar-tst-2025", ".xlsx"), "MWI_1_2_pepfar-tst-2025_20251112-1030.xlsx"),
    ],
)
def test_the_file_is_named_after_its_areas_what_it_is_and_the_time(metadata, expected):
    named = DownloadMetadata(areas=metadata[0], file_label=metadata[1], file_extension=metadata[2])
    assert download_filename(named, datetime(2025, 11, 12, 10, 30, 59, tzinfo=UTC)) == expected


def test_the_minute_is_zero_padded():
    named = DownloadMetadata(areas="MWI", file_label="x", file_extension=".zip")
    assert download_filename(named, datetime(2026, 1, 2, 3, 4, tzinfo=UTC)) == "MWI_x_20260102-0304.zip"
