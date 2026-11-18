"""A fake ADR (a CKAN site), for the tests of the client and of the endpoints that use it.

It is an HTTP transport, so no call goes over the network. It records each call. By default it answers from a small
set of datasets. A test can make an action fail, or make a connection fail.

Its answers must look like the answers of the real ADR. The tests in `tests/api/test_adr_live.py` call the real ADR, so
they show when the real ADR changes.
"""

import re
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

import httpx2
import pytest

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


@dataclass
class FakeAdr:
    calls: list[httpx2.Request] = field(default_factory=list)
    # An action that gives a different answer from the normal one
    failures: dict[str, Callable[[httpx2.Request], httpx2.Response]] = field(default_factory=dict)
    http: httpx2.AsyncClient = field(init=False)

    def __post_init__(self):
        # The same base address as the real client has, for an `adr_url` of https://adr.example/
        self.http = httpx2.AsyncClient(
            transport=httpx2.MockTransport(self._handler), base_url="https://adr.example/api/3/action/"
        )

    def fail(self, action: str, response: httpx2.Response):
        self.failures[action] = lambda request: response

    def fail_to_connect(self, action: str, error: Exception):
        def raise_it(request: httpx2.Request) -> httpx2.Response:
            raise error

        self.failures[action] = raise_it

    def queries(self, action: str) -> list[dict[str, str]]:
        """The parameters of each call of the action."""
        return [dict(call.url.params) for call in self.calls if call.url.path.endswith(f"/{action}")]

    def _handler(self, request: httpx2.Request) -> httpx2.Response:
        self.calls.append(request)
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
        pytest.fail(f"The fake ADR does not know the action {action}")
