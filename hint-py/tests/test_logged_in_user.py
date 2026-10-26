from typing import Annotated

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from dependencies import User, logged_in_user


@pytest.fixture
def client():
    app = FastAPI()

    @app.get("/private")
    def private(user: Annotated[User, Depends(logged_in_user)]):
        return {"user": user.id}

    return TestClient(app)


def test_guest_is_rejected(client):
    r = client.get("/private", headers={"X-Hint-User": "guest", "X-Hint-Version-Id": "v1"})
    assert r.status_code == 401


def test_logged_in_user_is_allowed(client):
    r = client.get("/private", headers={"X-Hint-User": "a@b.com", "X-Hint-Version-Id": "v1"})
    assert r.json() == {"user": "a@b.com"}
