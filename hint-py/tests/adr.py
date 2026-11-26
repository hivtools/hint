"""A fake ADR (a CKAN site), for the tests of the client and of the endpoints that use it.

It is an HTTP transport, so no call goes over the network. It records each call. By default it answers from a small
set of datasets. A test can make an action fail, or make a connection fail.

It also takes what a user pushes: a release is made or deleted, and a file is uploaded as a resource. It keeps its own
releases and resources, so a test sees the effect of one call on the next (a release that was deleted is no longer in the
list). It records the form of each call that changes something, and each file that is uploaded, with its content.

It also serves files, as ADR does for an import. The real ADR answers a download with a redirect to its storage, which
is on another address (https://blob.example/ here). A test can serve a file at a link, or redirect a link.

Its answers must look like the answers of the real ADR. The tests in `tests/api/test_adr_live.py` call the real ADR, so
they show when the real ADR changes.
"""

import copy
import hashlib
import re
from collections.abc import AsyncIterator, Callable
from dataclasses import dataclass, field
from typing import Any, cast
from urllib.parse import parse_qsl

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


def _not_found() -> httpx2.Response:
    return ckan_error(404, "Not found", "Not Found Error")


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


@dataclass(frozen=True)
class Upload:
    """A file that a call uploaded: the part `upload` of a multipart form."""

    action: str
    # The other parts of the form
    fields: dict[str, str]
    filename: str
    content_type: str
    content: bytes

    @property
    def md5(self) -> str:
        return hashlib.md5(self.content, usedforsecurity=False).hexdigest().upper()


def _parts(request: httpx2.Request) -> list[tuple[dict[str, str], bytes]]:
    """The parts of a multipart body: the headers of each (the names of its parameters in the Content-Disposition), and its
    content."""
    boundary = re.search(r"boundary=([^;]+)", request.headers["Content-Type"])
    assert boundary, "a multipart body has a boundary"
    parts = []
    for raw in request.content.split(b"--" + boundary.group(1).encode())[1:-1]:
        head, _, content = raw.removeprefix(b"\r\n").partition(b"\r\n\r\n")
        headers = dict(re.findall(r'(\w+)="([^"]*)"', head.decode()))
        content_type = re.search(r"Content-Type: (\S+)", head.decode())
        headers["content_type"] = content_type.group(1) if content_type else ""
        parts.append((headers, content.removesuffix(b"\r\n")))
    return parts


class _Transport(httpx2.AsyncBaseTransport):
    """Gives each request to the fake as it is. It reads the body in the pieces that the client sends, and notes how big
    they are, which `httpx2.MockTransport` does not (it reads all of the body at once)."""

    def __init__(self, fake: FakeAdr):
        self._fake = fake

    async def handle_async_request(self, request: httpx2.Request) -> httpx2.Response:
        stream = cast(httpx2.AsyncByteStream, request.stream)
        pieces = [piece async for piece in stream]
        self._fake.body_pieces.append([len(piece) for piece in pieces])
        whole = httpx2.Request(
            request.method,
            request.url,
            headers=request.headers,
            content=b"".join(pieces),
            extensions=request.extensions,
        )
        return self._fake._handler(whole)


@dataclass
class FakeAdr:
    calls: list[httpx2.Request] = field(default_factory=list)
    # The sizes of the pieces of the body of each call, in the order of `calls`. A body that is read as one piece is not
    # streamed.
    body_pieces: list[list[int]] = field(default_factory=list)
    # The files that were uploaded, in order
    uploads: list[Upload] = field(default_factory=list)
    # The releases of each dataset, and the resources that ADR has (by id), which the calls change
    releases: dict[str, list[dict[str, str]]] = field(default_factory=lambda: copy.deepcopy(RELEASES))
    resources: dict[str, dict[str, Any]] = field(default_factory=dict)
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
        return create_adr_http_client(Settings(adr_url=adr_url), transport=self.transport)

    @property
    def transport(self) -> httpx2.AsyncBaseTransport:
        """What a client calls to reach this fake, for a test that makes its own client."""
        return _Transport(self)

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
        """The parameters of each call of the action, in the query."""
        return [dict(call.url.params) for call in self.calls if call.url.path.endswith(f"/{action}")]

    def forms(self, action: str) -> list[dict[str, str]]:
        """The parameters of each call of the action that has them in its body: a form, or the parts of a multipart form
        that are not the file."""
        return [self._body_fields(call) for call in self.calls if call.url.path.endswith(f"/{action}") and call.content]

    @staticmethod
    def _body_fields(request: httpx2.Request) -> dict[str, str]:
        if request.headers["Content-Type"].startswith("multipart/form-data"):
            return {h["name"]: content.decode() for h, content in _parts(request) if "filename" not in h}
        return dict(parse_qsl(request.content.decode(), keep_blank_values=True))

    def _handler(self, request: httpx2.Request) -> httpx2.Response:
        self.calls.append(request)
        if "/api/3/action/" not in request.url.path:
            answer = self.files.get(str(request.url.copy_with(query=None)))
            # ADR's page for a file that it does not have
            return answer(request) if answer else httpx2.Response(404, html="<html>Not found</html>")
        action = request.url.path.rsplit("/", 1)[-1]
        if action in self.failures:
            return self.failures[action](request)
        params = dict(request.url.params)
        if request.content:
            params |= self._body_fields(request)
            if request.headers["Content-Type"].startswith("multipart/form-data"):
                for headers, content in _parts(request):
                    if "filename" in headers:
                        self.uploads.append(
                            Upload(action, params, headers["filename"], headers["content_type"], content)
                        )
        return self._world(action, params)

    def _world(self, action: str, params: dict[str, str]) -> httpx2.Response:
        if action in ("version_delete", "dataset_version_create", "resource_show", "resource_create", "resource_patch"):
            return self._releases_and_resources(action, params)
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
            return ckan_ok(self.releases.get(params["dataset_id"], []))
        if action == "organization_list_for_user":
            return ckan_ok(ORGS)
        if action == "package_activity_list":
            return ckan_ok(ACTIVITIES.get(params["id"], []))
        pytest.fail(f"The fake ADR does not know the action {action}")

    def _releases_and_resources(self, action: str, params: dict[str, str]) -> httpx2.Response:
        if action == "version_delete":
            found = [r for releases in self.releases.values() for r in releases if r["id"] == params["version_id"]]
            for releases in self.releases.values():
                releases[:] = [r for r in releases if r["id"] != params["version_id"]]
            return ckan_ok(None) if found else ckan_error(404, "Not found", "Not Found Error")
        if action == "dataset_version_create":
            releases = self.releases.setdefault(params["dataset_id"], [])
            if any(r["name"] == params["name"] for r in releases):
                return ckan_error(409, "Version names must be unique per dataset", "Validation Error")
            release = {
                "id": f"new-release-{len(self.calls)}",
                "dataset_id": params["dataset_id"],
                "name": params["name"],
            }
            releases.append(release)
            return ckan_ok(release)
        if action == "resource_show":
            return ckan_ok(self.resources[params["id"]]) if params["id"] in self.resources else _not_found()
        if action == "resource_create":
            resource = {k: v for k, v in params.items() if k not in ("package_id", "restricted")}
            resource["id"] = f"new-resource-{len(self.resources) + 1}"
            self.resources[resource["id"]] = resource
            return ckan_ok(resource)
        if action == "resource_patch":
            if params["id"] not in self.resources:
                return _not_found()
            self.resources[params["id"]] |= params
            return ckan_ok(self.resources[params["id"]])
        pytest.fail(f"The fake ADR does not know the action {action}")
