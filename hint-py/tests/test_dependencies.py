from typing import Annotated

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.dependencies import User, current_adr_access_token, logged_in_user


@pytest.fixture
def client():
    app = FastAPI()

    @app.get("/private")
    def private(user: Annotated[User, Depends(logged_in_user)]):
        return {"user": user.id}

    @app.get("/token")
    def token(access_token: Annotated[str | None, Depends(current_adr_access_token)]):
        return {"token": access_token}

    return TestClient(app)


def test_guest_is_rejected(client):
    r = client.get("/private", headers={"X-Hint-User": "guest"})
    assert r.status_code == 401


def test_logged_in_user_is_allowed(client):
    r = client.get("/private", headers={"X-Hint-User": "a@b.com"})
    assert r.json() == {"user": "a@b.com"}


def test_access_token_is_read_from_the_header(client):
    assert client.get("/token", headers={"X-Hint-Access-Token": "a.b.c"}).json() == {"token": "a.b.c"}


def test_no_access_token_without_the_header_or_with_a_blank_one(client):
    assert client.get("/token").json() == {"token": None}
    assert client.get("/token", headers={"X-Hint-Access-Token": ""}).json() == {"token": None}
