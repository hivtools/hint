from typing import Annotated

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.dependencies import User, current_adr_access_token, current_user, logged_in_user
from app.services.web_sessions import WebSession, current_web_session


def a_session(user_id: str | None, access_token: str | None = None, guest_versions=frozenset()) -> WebSession:
    return WebSession(
        id_hash=b"x",
        user_id=user_id,
        access_token=access_token,
        oauth_state=None,
        redirect_to=None,
        guest_version_ids=frozenset(guest_versions),
    )


@pytest.fixture
def app():
    app = FastAPI()

    @app.get("/private")
    def private(user: Annotated[User, Depends(logged_in_user)]):
        return {"user": user.id}

    @app.get("/user")
    def user(user: Annotated[User, Depends(current_user)]):
        return {"user": user.id, "guest_versions": sorted(user.guest_version_ids)}

    @app.get("/token")
    def token(access_token: Annotated[str | None, Depends(current_adr_access_token)]):
        return {"token": access_token}

    return app


def client_with(app: FastAPI, session: WebSession | None) -> TestClient:
    app.dependency_overrides[current_web_session] = lambda: session
    return TestClient(app)


def test_no_session_is_the_guest(app):
    assert client_with(app, None).get("/user").json() == {"user": "guest", "guest_versions": []}


def test_a_guest_session_is_the_guest_with_its_versions(app):
    r = client_with(app, a_session(None, guest_versions={"v2", "v1"})).get("/user")
    assert r.json() == {"user": "guest", "guest_versions": ["v1", "v2"]}


def test_guest_is_rejected(app):
    assert client_with(app, None).get("/private").status_code == 401
    assert client_with(app, a_session(None)).get("/private").status_code == 401


def test_logged_in_user_is_allowed(app):
    assert client_with(app, a_session("a@b.com")).get("/private").json() == {"user": "a@b.com"}


def test_access_token_is_read_from_the_session(app):
    assert client_with(app, a_session("a@b.com", "a.b.c")).get("/token").json() == {"token": "a.b.c"}


def test_no_access_token_without_one_in_the_session_or_with_a_blank_one(app):
    assert client_with(app, None).get("/token").json() == {"token": None}
    assert client_with(app, a_session("a@b.com")).get("/token").json() == {"token": None}
    assert client_with(app, a_session("a@b.com", "")).get("/token").json() == {"token": None}


def test_a_guest_never_has_an_access_token(app):
    # A guest's session keeps no token, but if it did, it would not be used
    assert client_with(app, a_session(None, "a.b.c")).get("/token").json() == {"token": None}
