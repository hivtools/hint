import re

import httpx
import pytest
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.errors import ProjectDoesNotExistError, register_error_handlers


class Body(BaseModel):
    name: str


@pytest.fixture
async def client():
    app = FastAPI()
    register_error_handlers(app)

    @app.get("/missing-project")
    async def missing_project():
        raise ProjectDoesNotExistError

    @app.get("/boom")
    async def boom():
        raise RuntimeError("secret details")  # noqa: TRY003

    @app.get("/private")
    async def private():
        raise HTTPException(status_code=401)

    @app.get("/teapot")
    async def teapot():
        raise HTTPException(status_code=418, detail="short and stout", headers={"X-Tea": "oolong"})

    @app.post("/body")
    async def body(body: Body):
        return body

    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.mark.parametrize(
    ("accept_language", "detail"),
    [
        (None, "Project does not exist."),
        ("fr", "Le projet n'existe pas."),
        ("fr-FR", "Le projet n'existe pas."),
        ("pt-BR,pt;q=0.9,en;q=0.8", "O projeto não existe."),
        ("de", "Project does not exist."),
    ],
)
async def test_hint_errors_are_translated(client, accept_language, detail):
    headers = {"Accept-Language": accept_language} if accept_language else {}

    r = await client.get("/missing-project", headers=headers)

    assert r.status_code == 400
    assert r.json() == {"data": {}, "errors": [{"error": "OTHER_ERROR", "detail": detail}], "status": "failure"}


async def test_unexpected_errors_are_reported_with_a_code_and_no_details(client):
    r = await client.get("/boom", headers={"Accept-Language": "pt"})

    assert r.status_code == 500
    [error] = r.json()["errors"]
    assert error["error"] == "OTHER_ERROR"
    assert error["detail"].startswith("Um erro inesperado ocorreu.")
    assert re.search(r"Naomi.*u[0-9a-f]{8}.*naomi-support@imperial\.ac\.uk", error["detail"])
    assert "secret details" not in r.text


async def test_invalid_request_bodies_are_400_and_other_media_types_415(client):
    assert (await client.post("/body", json={})).status_code == 400
    assert (await client.post("/body")).status_code == 400
    assert (await client.post("/body", data={"name": "x"})).status_code == 415
    assert (await client.post("/body", json={"name": "x"})).json() == {"name": "x"}


async def test_errors_raised_by_fastapi_have_the_same_shape(client):
    r = await client.get("/private")

    assert r.status_code == 401
    assert r.json() == {"data": {}, "errors": [{"error": "OTHER_ERROR", "detail": "Unauthorized"}], "status": "failure"}
    missing = await client.get("/no-such-route")
    assert missing.status_code == 404
    assert missing.json()["errors"] == [{"error": "OTHER_ERROR", "detail": "Not Found"}]


async def test_http_errors_keep_their_status_message_and_headers(client):
    r = await client.get("/teapot")

    assert r.status_code == 418
    assert r.headers["X-Tea"] == "oolong"
    assert r.json() == {
        "data": {},
        "errors": [{"error": "OTHER_ERROR", "detail": "short and stout"}],
        "status": "failure",
    }


async def test_unexpected_errors_are_logged_with_the_code_the_user_is_shown(client, caplog):
    r = await client.get("/boom")

    [code] = re.findall(r"u[0-9a-f]{8}", r.json()["errors"][0]["detail"])[:1]
    [record] = [r for r in caplog.records if "Unexpected error" in r.getMessage()]
    assert record.levelname == "ERROR"
    assert code in record.getMessage()
    assert "GET /boom gave 500" in record.getMessage()
    assert "secret details" in record.getMessage()
    assert record.exc_info is not None


@pytest.mark.parametrize(
    ("request_kwargs", "status", "reason"),
    [
        ({"json": {}}, 400, "body.name: Field required"),
        ({"data": {"name": "x"}}, 415, "body"),
    ],
)
async def test_invalid_requests_are_logged_without_the_values_sent(client, caplog, request_kwargs, status, reason):
    r = await client.post("/body", **request_kwargs)

    assert r.status_code == status
    [record] = [r for r in caplog.records if "Unexpected error" in r.getMessage()]
    assert record.levelname == "ERROR"
    assert reason in record.getMessage()


async def test_hint_errors_and_http_errors_are_not_logged_as_unexpected(client, caplog):
    await client.get("/missing-project")
    await client.get("/teapot")

    assert caplog.records == []
