from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

IDENTITY = {"X-Hint-User": "test.user@example.com"}


def test_whoami_reads_identity_headers():
    r = client.get("/items/whoami", headers=IDENTITY)
    assert r.status_code == 200
    assert r.json() == {"user": "test.user@example.com", "version_id": None, "is_guest": False}


def test_whoami_reads_the_version_the_tab_is_working_on():
    r = client.get("/items/whoami", headers={**IDENTITY, "X-Version-Id": "v1"})
    assert r.json()["version_id"] == "v1"


def test_a_blank_version_header_means_no_version():
    r = client.get("/items/whoami", headers={**IDENTITY, "X-Version-Id": ""})
    assert r.json()["version_id"] is None


def test_guest_is_identified():
    r = client.get("/items/whoami", headers={**IDENTITY, "X-Hint-User": "guest"})
    assert r.json()["is_guest"] is True


def test_missing_identity_is_rejected():
    assert client.get("/items/whoami").status_code == 401
    assert client.get("/items/1").status_code == 401


def test_item_with_identity():
    r = client.get("/items/1", headers=IDENTITY)
    assert r.status_code == 200
    assert r.json() == {"item_id": 1}
