import re


async def test_version_is_public_and_returns_the_project_version(anonymous_client):
    # No identity headers: it has to work without a logged in user
    r = await anonymous_client.get("/version")
    assert r.status_code == 200
    assert re.fullmatch(r"\d+\.\d+\.\d+", r.json()["version"])
