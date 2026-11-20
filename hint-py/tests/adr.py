"""A fake ADR (a CKAN site), for the tests of the client and of the endpoints that use it.

It is an HTTP transport, so no call goes over the network. It records each call. By default it answers from a small
set of datasets. A test can make an action fail, or make a connection fail.

It also serves files, as ADR does for an import. The real ADR answers a download with a redirect to its storage, which
is on another address (https://blob.example/ here). A test can serve a file at a link, or redirect a link.

Its answers must look like the answers of the real ADR. The tests in `tests/api/test_adr_live.py` call the real ADR, so
they show when the real ADR changes.
"""

import re
from collections.abc import AsyncIterator, Callable
from dataclasses import dataclass, field
from typing import Any

import httpx2
import pytest

from app.clients.adr_client import create_adr_http_client
from app.config import Settings

# The resource type of each kind of file, and the type of the datasets of this year and of last year (see app/config.py)
PJNZ = "inputs-unaids-spectrum-file"
SHAPE = "inputs-unaids-geographic"
OUTPUT_ZIP = "inputs-unaids-naomi-output-zip"
OUTPUT_SUMMARY = "inputs-unaids-naomi-report"
THIS_YEAR = "country-estimates-27"
LAST_YEAR = "country-estimates-26"


def resource(resource_id: str, resource_type: str) -> dict:
    return {
        "id": resource_id,
        "name": resource_id,
        "resource_type": resource_type,
        "url": f"http://adr.example/{resource_id}",
    }


def dataset(dataset_id: str, dataset_type: str, resources: list[dict]) -> dict:
    return {
        "id": dataset_id,
        "name": dataset_id,
        "title": f"Dataset {dataset_id}",
        "type": dataset_type,
        "resources": resources,
    }


def ckan_ok(result: object) -> httpx2.Response:
    return httpx2.Response(200, json={"success": True, "result": result})


def ckan_error(status: int, message: str, error_type: str = "Authorization Error") -> httpx2.Response:
    return httpx2.Response(status, json={"success": False, "error": {"message": message, "__type": error_type}})


# The datasets, the releases of a dataset, and the dataset as it was at each release
DATASETS = [
    dataset("d-input-1", THIS_YEAR, [resource("r1", PJNZ), resource("r2", SHAPE)]),
    dataset("d-input-empty", THIS_YEAR, []),
    dataset("d-output-1", THIS_YEAR, [resource("r3", OUTPUT_ZIP), resource("r4", OUTPUT_SUMMARY)]),
    dataset("d-output-old", LAST_YEAR, [resource("r5", OUTPUT_ZIP)]),
    dataset("d-no-zip", THIS_YEAR, [resource("r6", OUTPUT_SUMMARY)]),
]
RELEASES = {"d-output-1": [{"id": "rel-1", "name": "v1"}, {"id": "rel-2", "name": "v2"}]}
RELEASE_DATASETS = {
    "d-output-1@rel-1": dataset("d-output-1", THIS_YEAR, [resource("r3", OUTPUT_ZIP)]),
    "d-output-1@rel-2": dataset("d-output-1", THIS_YEAR, [resource("r4", OUTPUT_SUMMARY)]),
}
ORGS = [{"id": "org-1", "name": "unaids"}, {"id": "org-2", "name": "ministry"}]
# The activities of a dataset, the newest first
ACTIVITIES = {"d-input-1": [{"id": "act-new"}, {"id": "act-old"}]}

# Where the fake ADR keeps its files, as the real ADR keeps them on another address than its own
STORAGE = "https://blob.example/storage"


def download_link(dataset_id: str, resource_id: str, filename: str, address: str = "https://adr.example/") -> str:
    """The link of a file on ADR, as ADR gives it in a resource."""
    return f"{address}dataset/{dataset_id}/resource/{resource_id}/download/{filename}"


async def _pieces(content: bytes, size: int) -> AsyncIterator[bytes]:
    for start in range(0, len(content), size):
        yield content[start : start + size]


def file_response(
    content: bytes, content_type: str = "application/octet-stream", chunked: bool = False
) -> httpx2.Response:
    """A file. A chunked one has no Content-Length, as the real storage of ADR sends it: its size is only known at the
    end."""
    if chunked:
        return httpx2.Response(
            200, content=_pieces(content, max(1, len(content) // 8)), headers={"Content-Type": content_type}
        )
    return httpx2.Response(200, content=content, headers={"Content-Type": content_type})


@dataclass
class FakeAdr:
    calls: list[httpx2.Request] = field(default_factory=list)
    # An action that gives a different answer from the normal one
    failures: dict[str, Callable[[httpx2.Request], httpx2.Response]] = field(default_factory=dict)
    # The answer for each link that is not an action (a download), by the link without its query
    files: dict[str, Callable[[httpx2.Request], httpx2.Response]] = field(default_factory=dict)
    http: httpx2.AsyncClient = field(init=False)

    def __post_init__(self):
        self.http = self.http_at("https://adr.example/")

    def http_at(self, adr_url: str) -> httpx2.AsyncClient:
        """The client that the app makes for this `adr_url`, which calls this fake. `http` is the one for
        https://adr.example/."""
        return create_adr_http_client(Settings(adr_url=adr_url), transport=httpx2.MockTransport(self._handler))

    def fail(self, action: str, response: httpx2.Response):
        self.failures[action] = lambda request: response

    def fail_to_connect(self, action: str, error: Exception):
        def raise_it(request: httpx2.Request) -> httpx2.Response:
            raise error

        self.failures[action] = raise_it

    def serve(
        self, link: str, content: bytes, content_type: str = "application/octet-stream", chunked: bool = False
    ) -> None:
        """Answers a download of the link with the file. ADR redirects the link to its storage, which sends the file."""
        stored = f"{STORAGE}/{len(self.files)}"
        self.redirect(link, f"{stored}?token=a-token-to-read-the-file")
        self.files[stored] = lambda request: file_response(content, content_type, chunked)

    def answer(self, link: str, response: httpx2.Response) -> None:
        """Answers a download of the link with this answer, as it is."""
        self.files[link] = lambda request: response

    def redirect(self, link: str, location: str, status: int = 302) -> None:
        self.answer(link, httpx2.Response(status, headers={"Location": location}))

    def fail_to_download(self, link: str, error: Exception) -> None:
        def raise_it(request: httpx2.Request) -> httpx2.Response:
            raise error

        self.files[link] = raise_it

    def downloads(self) -> list[httpx2.Request]:
        """The calls that were not to an action of CKAN: the downloads, and the redirects that they followed."""
        return [call for call in self.calls if "/api/3/action/" not in call.url.path]

    def queries(self, action: str) -> list[dict[str, str]]:
        """The parameters of each call of the action."""
        return [dict(call.url.params) for call in self.calls if call.url.path.endswith(f"/{action}")]

    def _handler(self, request: httpx2.Request) -> httpx2.Response:
        self.calls.append(request)
        if "/api/3/action/" not in request.url.path:
            answer = self.files.get(str(request.url.copy_with(query=None)))
            # ADR's page for a file that it does not have
            return answer(request) if answer else httpx2.Response(404, html="<html>Not found</html>")
        action = request.url.path.rsplit("/", 1)[-1]
        if action in self.failures:
            return self.failures[action](request)
        return self._world(action, dict(request.url.params))

    def _world(self, action: str, params: dict[str, str]) -> httpx2.Response:
        if action == "package_search":
            types = set(re.split(r"\s+OR\s+", re.findall(r"type:\(([^)]*)\)", params["q"])[0]))
            results = [d for d in DATASETS if d["type"] in types]
            return ckan_ok({"count": len(results), "results": results})
        if action == "package_show":
            found: Any
            if "release" in params:
                found = RELEASE_DATASETS.get(f"{params['id']}@{params['release']}")
            else:
                found = next((d for d in DATASETS if d["id"] == params["id"]), None)
            return ckan_ok(found) if found else ckan_error(404, "Not found", "Not Found Error")
        if action == "dataset_version_list":
            return ckan_ok(RELEASES.get(params["dataset_id"], []))
        if action == "organization_list_for_user":
            return ckan_ok(ORGS)
        if action == "package_activity_list":
            return ckan_ok(ACTIVITIES.get(params["id"], []))
        pytest.fail(f"The fake ADR does not know the action {action}")
