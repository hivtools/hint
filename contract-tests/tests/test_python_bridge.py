"""The nginx proxy in front of Kotlin and Python: migrated endpoints get their identity from Kotlin.

Not recorded against Kotlin like the rest of the suite (there are no goldens): these are plain assertions about the proxy
and the identity bridge, and are skipped when the SUT is started without the proxy (scripts/dev.sh up --no-proxy).
"""
from __future__ import annotations

import pytest

from hintcontract.flows import TEST_USER
from hintcontract.http import Client


@pytest.fixture
def client(env):
    c = Client(env.base_url)
    if c.send("GET", "/items/whoami").status == 404:
        pytest.skip("SUT is not behind the proxy / python API")
    yield c
    c.close()


def login(c: Client):
    r = c.send("POST", "/callback/formClient", data={"username": TEST_USER, "password": "password"})
    assert r.status == 303


def test_python_sees_guest_without_a_session(client):
    r = client.send("GET", "/items/whoami", send_cookies=False)
    assert r.status == 200
    assert r.json()["user"] == "guest"
    assert r.json()["is_guest"] is True


def test_python_sees_the_logged_in_user(client):
    login(client)
    body = client.send("GET", "/items/whoami").json()
    assert body["user"] == TEST_USER
    assert body["is_guest"] is False


def test_session_cookie_from_first_visit_reaches_the_browser_and_keeps_version_id(client):
    first = client.send("GET", "/items/whoami", send_cookies=False)
    assert any(c.startswith("JSESSIONID=") for c in first.set_cookie)
    client.cookies["JSESSIONID"] = next(c.split(";")[0].split("=", 1)[1] for c in first.set_cookie
                                        if c.startswith("JSESSIONID="))
    again = client.send("GET", "/items/whoami").json()
    assert again["version_id"] == first.json()["version_id"]


@pytest.mark.needs_db
def test_python_shares_the_session_version_id_with_kotlin(client, db):
    login(client)
    from_python = client.send("GET", "/items/whoami").json()["version_id"]
    # Kotlin keeps the same id in the session, so a Kotlin page load creates the version row for it
    client.send("GET", "/")
    assert [r["id"] for r in db.execute("select id from project_version where id = %s", (from_python,))] == [from_python]


def test_client_cannot_spoof_the_identity_headers(client):
    r = client.send("GET", "/items/whoami", headers={"X-Hint-User": "admin", "X-Hint-Version-Id": "forged"},
                    send_cookies=False)
    assert r.json()["user"] == "guest"
    assert r.json()["version_id"] != "forged"


def test_internal_endpoints_are_not_public(client):
    assert client.send("GET", "/internal/whoami").status == 404
    assert client.send("GET", "/_whoami").status == 404


def test_other_paths_still_go_to_kotlin(client):
    assert client.send("GET", "/login").status == 200
    assert client.send("GET", "/items/1", send_cookies=False).json() == {"item_id": 1}
