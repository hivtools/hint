"""GET /metrics: worker counts for monitoring."""

import json

import httpx2
import pytest

from tests.hintr import HINTR_FAILURE

NO_WORKERS = (
    "running 1\nbusy_workers 0\nidle_workers 0\npaused_workers 0\nexited_workers 0\nlost_workers 0\nlive_workers 0"
)


def worker_status(workers: dict[str, str]) -> bytes:
    return json.dumps({"status": "success", "errors": None, "data": workers}).encode()


async def test_metrics_count_the_workers_in_each_state(anonymous_client, hintr):
    workers = {
        "w1": "BUSY",
        "w2": "idle",
        "w3": "PAUSED",
        "w4": "EXITED",
        "w5": "LOST",
        "w6": "SOMETHING_NEW",
        "w7": "idle",
    }
    hintr.answer(200, content=worker_status(workers))

    r = await anonymous_client.get("/metrics")

    assert [(c.method, c.url.path) for c in hintr.calls] == [("GET", "/hintr/worker/status")]
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/plain")
    assert r.text == (
        "running 1\nbusy_workers 1\nidle_workers 2\npaused_workers 1\nexited_workers 1\nlost_workers 1\n"
        "something_new_workers 1\nlive_workers 4"
    )


@pytest.mark.parametrize(
    ("hintr_status", "content"),
    [
        (200, worker_status({})),
        (200, b"not json"),
        (200, b'{"status": "success", "data": ["not", "workers"]}'),
        (200, b'{"status": "success", "data": null}'),
        (500, b"no"),
        (500, json.dumps(HINTR_FAILURE).encode()),
    ],
    ids=["no workers", "malformed", "a list", "null", "hintr failing", "hintr failure body"],
)
async def test_metrics_report_no_workers_when_the_status_is_not_a_list_of_workers(
    anonymous_client, hintr, hintr_status, content
):
    hintr.answer(hintr_status, content=content)
    r = await anonymous_client.get("/metrics")
    assert r.status_code == 200
    assert r.text == NO_WORKERS


async def test_metrics_report_no_workers_when_hintr_is_down(anonymous_client, hintr):
    hintr.fail_to_connect(httpx2.ConnectError("refused"))
    r = await anonymous_client.get("/metrics")
    assert r.status_code == 200
    assert r.text == NO_WORKERS
