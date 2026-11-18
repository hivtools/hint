IDENTITY = {"X-Hint-User": "test.user@example.com"}


async def test_whoami_reads_identity_headers(anonymous_client):
    r = await anonymous_client.get("/items/whoami", headers=IDENTITY)
    assert r.status_code == 200
    assert r.json() == {
        "user": "test.user@example.com",
        "version_id": None,
        "is_guest": False,
        "guest_version_ids": [],
        "has_access_token": False,
    }


async def test_whoami_reads_the_version_the_tab_is_working_on(anonymous_client):
    r = await anonymous_client.get("/items/whoami", headers={**IDENTITY, "X-Version-Id": "v1"})
    assert r.json()["version_id"] == "v1"


async def test_a_blank_version_header_means_no_version(anonymous_client):
    r = await anonymous_client.get("/items/whoami", headers={**IDENTITY, "X-Version-Id": ""})
    assert r.json()["version_id"] is None


async def test_guest_is_identified(anonymous_client):
    r = await anonymous_client.get("/items/whoami", headers={**IDENTITY, "X-Hint-User": "guest"})
    assert r.json()["is_guest"] is True


async def test_guest_versions_are_the_ones_the_server_gave_to_the_guest(anonymous_client):
    headers = {"X-Hint-User": "guest", "X-Hint-Guest-Versions": "v1, v2,,v3 "}
    r = await anonymous_client.get("/items/whoami", headers=headers)
    assert r.json()["guest_version_ids"] == ["v1", "v2", "v3"]


async def test_guest_without_versions(anonymous_client):
    r = await anonymous_client.get("/items/whoami", headers={"X-Hint-User": "guest"})
    assert r.json()["guest_version_ids"] == []


async def test_a_logged_in_user_has_no_guest_versions_whatever_the_header_says(anonymous_client):
    r = await anonymous_client.get("/items/whoami", headers={**IDENTITY, "X-Hint-Guest-Versions": "v1"})
    assert r.json()["guest_version_ids"] == []


async def test_the_access_token_of_an_sso_user_is_read_but_never_returned(anonymous_client):
    r = await anonymous_client.get("/items/whoami", headers={**IDENTITY, "X-Hint-Access-Token": "an.auth0.token"})
    assert r.json()["has_access_token"] is True
    assert "an.auth0.token" not in r.text


async def test_a_blank_access_token_header_means_no_token(anonymous_client):
    r = await anonymous_client.get("/items/whoami", headers={**IDENTITY, "X-Hint-Access-Token": ""})
    assert r.json()["has_access_token"] is False


async def test_missing_identity_is_rejected(anonymous_client):
    assert (await anonymous_client.get("/items/whoami")).status_code == 401
    assert (await anonymous_client.get("/items/1")).status_code == 401


async def test_item_with_identity(anonymous_client):
    r = await anonymous_client.get("/items/1", headers=IDENTITY)
    assert r.status_code == 200
    assert r.json() == {"item_id": 1}
