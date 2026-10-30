"""Worker counts for monitoring."""

import json

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from app.clients.hintr_client import Hintr

router = APIRouter()

# Always listed, even when there are none
KNOWN_STATUSES = ("busy", "idle", "paused", "exited", "lost")
LIVE_STATUSES = ("busy", "idle", "paused")


def _worker_statuses(body: bytes) -> dict[str, str]:
    """Worker name to status. An answer that is not a list of workers (a failure, say) counts as no workers.

    The body is always a JSON object: the hintr client makes everything it gets look like a hint response.
    """
    data = json.loads(body).get("data")
    return data if isinstance(data, dict) else {}


@router.get("/metrics", response_class=PlainTextResponse)
async def metrics(hintr: Hintr) -> PlainTextResponse:
    statuses = dict.fromkeys(KNOWN_STATUSES, 0)
    worker_status = await hintr.forward("GET", "/hintr/worker/status")
    for status in _worker_statuses(bytes(worker_status.body)).values():
        # A status that is not known is counted too, under its own name
        key = str(status).lower()
        statuses[key] = statuses.get(key, 0) + 1
    statuses["live"] = sum(statuses[s] for s in LIVE_STATUSES)
    counts = "\n".join(f"{name}_workers {count}" for name, count in statuses.items())
    return PlainTextResponse(f"running 1\n{counts}")
