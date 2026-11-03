from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

IDENTITY = {"X-Hint-User": "test.user@example.com"}


def test_whoami_reads_identity_headers():
    r = client.get("/items/whoami", headers=IDENTITY)
    assert r.status_code == 200
    assert r.json() == {
        "user": "test.user@example.com",
        "version_id": None,
        "is_guest": False,
        "guest_version_ids": [],
    }


def test_whoami_reads_the_version_the_tab_is_working_on():
    r = client.get("/items/whoami", headers={**IDENTITY, "X-Version-Id": "v1"})
    assert r.json()["version_id"] == "v1"


def test_a_blank_version_header_means_no_version():
    r = client.get("/items/whoami", headers={**IDENTITY, "X-Version-Id": ""})
    assert r.json()["version_id"] is None


def test_guest_is_identified():
    r = client.get("/items/whoami", headers={**IDENTITY, "X-Hint-User": "guest"})
    assert r.json()["is_guest"] is True


def test_guest_versions_are_the_ones_the_server_gave_to_the_guest():
    headers = {"X-Hint-User": "guest", "X-Hint-Guest-Versions": "v1, v2,,v3 "}
    r = client.get("/items/whoami", headers=headers)
    assert r.json()["guest_version_ids"] == ["v1", "v2", "v3"]


def test_guest_without_versions():
    r = client.get("/items/whoami", headers={"X-Hint-User": "guest"})
    assert r.json()["guest_version_ids"] == []


def test_a_logged_in_user_has_no_guest_versions_whatever_the_header_says():
    r = client.get("/items/whoami", headers={**IDENTITY, "X-Hint-Guest-Versions": "v1"})
    assert r.json()["guest_version_ids"] == []


def test_missing_identity_is_rejected():
    assert client.get("/items/whoami").status_code == 401
    assert client.get("/items/1").status_code == 401


def test_item_with_identity():
    r = client.get("/items/1", headers=IDENTITY)
    assert r.status_code == 200
    assert r.json() == {"item_id": 1}
