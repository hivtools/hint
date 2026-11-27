"""Guests cannot use the project endpoints."""

import pytest

from tests.api.helpers import assert_failure, make_client
from tests.support import OTHER_USER

GUEST_REQUESTS = [
    ("POST", "/project", {"json": {"name": "p"}}),
    ("POST", "/project/1/rename", {"json": {"name": "p"}}),
    ("POST", "/project/1/note", {"json": {"note": "p"}}),
    ("POST", "/project/1/clone", {"json": {"emails": [OTHER_USER]}}),
    ("DELETE", "/project/1", {}),
    ("POST", "/project/1/version", {"json": {"parent": "x"}}),
    ("POST", "/project/1/version/x/state", {"content": b"{}"}),
    ("POST", "/project/1/version/x/promote", {"json": {"name": "p"}}),
    ("POST", "/project/1/version/x/note", {"json": {"note": "p"}}),
    ("GET", "/project/1/version/x", {}),
    ("DELETE", "/project/1/version/x", {}),
    ("GET", "/project/current", {}),
    ("GET", "/projects/", {}),
]


@pytest.mark.parametrize(("method", "path", "request_kwargs"), GUEST_REQUESTS)
async def test_guests_are_not_allowed(api, method, path, request_kwargs):
    async with make_client("guest") as guest:
        r = await guest.request(method, path, **request_kwargs)

    # The Vue app sends the user to the login page on a 401
    assert_failure(r, 401, "Login required")
