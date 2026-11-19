import re

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_version_is_public_and_returns_the_project_version():
    # No identity headers: it has to work without a logged in user
    r = client.get("/version")
    assert r.status_code == 200
    assert re.fullmatch(r"\d+\.\d+\.\d+", r.json()["version"])
