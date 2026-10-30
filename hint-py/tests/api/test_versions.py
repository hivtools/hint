"""The version endpoints, through the whole app. These follow the scenarios in contract-tests/tests/test_versions.py
(which record the behaviour of the Kotlin app)."""

import pytest

from tests.api.helpers import STATE, add_file, assert_failure, create_project, save_state


async def test_new_version_copies_state_and_files_and_is_numbered(api, engine):
    project = await create_project(api)
    v1 = project["versions"][0]["id"]
    await save_state(api, project)
    await add_file(engine, v1)

    r = await api.post(f"/project/{project['id']}/version", json={"parent": v1, "note": "second"})

    assert r.status_code == 200
    v2 = r.json()["data"]
    assert (v2["versionNumber"], v2["note"]) == (2, "second")
    details = (await api.get(f"/project/{project['id']}/version/{v2['id']}")).json()["data"]
    assert details["state"] == STATE
    assert details["files"] == {
        "pjnz": {"hash": "abc123", "filename": "spectrum.pjnz", "fromAdr": False, "resource_url": None}
    }
    v3 = (await api.post(f"/project/{project['id']}/version", json={"parent": v1})).json()["data"]
    assert (v3["versionNumber"], v3["note"]) == (3, None)
    versions = (await api.get("/projects/")).json()["data"][0]["versions"]
    assert sorted(v["versionNumber"] for v in versions) == [1, 2, 3]


async def test_new_version_errors(api, other_api):
    project = await create_project(api)
    v1 = project["versions"][0]["id"]
    other_project = await create_project(api, "other project")
    url = f"/project/{project['id']}/version"

    assert (await api.post(url, json={})).status_code == 400
    assert (await api.post(url)).status_code == 400
    assert_failure(await api.post(url, json={"parent": "nonexistent"}), 400, "Version does not exist.")
    assert_failure(
        await api.post(f"/project/{other_project['id']}/version", json={"parent": v1}), 400, "Version does not exist."
    )
    assert_failure(await api.post("/project/999/version", json={"parent": v1}), 400, "Version does not exist.")
    assert_failure(await other_api.post(url, json={"parent": v1}), 400, "Version does not exist.")
    assert_failure(
        await api.post(url, json={"parent": "nonexistent"}, headers={"Accept-Language": "pt"}),
        400,
        "A versão não existe.",
    )
    assert len((await api.get("/projects/")).json()["data"][1]["versions"]) == 1


async def test_save_and_load_state(api):
    project = await create_project(api)
    v1 = project["versions"][0]["id"]

    await save_state(api, project)
    assert (await api.get(f"/project/{project['id']}/version/{v1}")).json()["data"] == {"state": STATE, "files": {}}
    await save_state(api, project, state='{"a": 2}')
    assert (await api.get(f"/project/{project['id']}/version/{v1}")).json()["data"]["state"] == '{"a": 2}'


@pytest.mark.parametrize("content_type", ["application/json", "text/plain"])
async def test_state_is_stored_exactly_as_sent(api, content_type):
    project = await create_project(api)
    v1 = project["versions"][0]["id"]
    state = '{"unicode": "café ☃", "n": 1.50}'

    r = await api.post(
        f"/project/{project['id']}/version/{v1}/state",
        content=state.encode("utf-8"),
        headers={"Content-Type": content_type},
    )

    assert r.status_code == 200
    assert (await api.get(f"/project/{project['id']}/version/{v1}")).json()["data"]["state"] == state


async def test_save_state_errors(api, other_api):
    project = await create_project(api)
    v1 = project["versions"][0]["id"]
    other_project = await create_project(api, "other")
    body = {"content": b"{}", "headers": {"Content-Type": "application/json"}}

    assert_failure(
        await api.post(f"/project/{project['id']}/version/nonexistent/state", **body), 400, "Version does not exist."
    )
    assert_failure(
        await api.post(f"/project/{other_project['id']}/version/{v1}/state", **body), 400, "Version does not exist."
    )
    assert_failure(await api.post("/project/999/version/x/state", **body), 400, "Version does not exist.")
    assert_failure(
        await other_api.post(f"/project/{project['id']}/version/{v1}/state", **body), 400, "Version does not exist."
    )
    assert (await api.post(f"/project/{project['id']}/version/{v1}/state")).status_code == 400


async def test_open_version_errors(api, other_api):
    project = await create_project(api)
    v1 = project["versions"][0]["id"]
    await save_state(api, project)
    other_project = await create_project(api, "other")

    assert_failure(await api.get(f"/project/{project['id']}/version/nonexistent"), 400, "Version does not exist.")
    assert_failure(await api.get(f"/project/{other_project['id']}/version/{v1}"), 400, "Version does not exist.")
    assert_failure(await api.get("/project/999/version/x"), 400, "Version does not exist.")
    assert_failure(await other_api.get(f"/project/{project['id']}/version/{v1}"), 400, "Version does not exist.")


async def test_open_version_without_saved_state_is_an_unexpected_error(api):
    # A quirk of the Kotlin app that is kept (contract test test_open_version_without_saved_state_is_a_500)
    project = await create_project(api)
    v1 = project["versions"][0]["id"]

    r = await api.get(f"/project/{project['id']}/version/{v1}")

    assert r.status_code == 500
    assert "show them this code" in r.json()["errors"][0]["detail"]


async def test_open_soft_deleted_version_still_works(api):
    # A quirk of the Kotlin app that is kept (contract test test_open_soft_deleted_version_still_works)
    project = await create_project(api)
    v1 = project["versions"][0]["id"]
    await save_state(api, project)
    await api.delete(f"/project/{project['id']}/version/{v1}")

    assert (await api.get(f"/project/{project['id']}/version/{v1}")).status_code == 200


async def test_update_version_note(api):
    project = await create_project(api)
    v1 = project["versions"][0]["id"]

    assert (await api.post(f"/project/{project['id']}/version/{v1}/note", json={"note": "a note"})).status_code == 200

    assert (await api.get("/projects/")).json()["data"][0]["versions"][0]["note"] == "a note"


async def test_update_version_note_errors(api, other_api):
    project = await create_project(api)
    v1 = project["versions"][0]["id"]
    other_project = await create_project(api, "other")

    assert_failure(
        await api.post(f"/project/{project['id']}/version/nonexistent/note", json={"note": "x"}),
        400,
        "Version does not exist.",
    )
    assert_failure(
        await api.post(f"/project/{other_project['id']}/version/{v1}/note", json={"note": "x"}),
        400,
        "Version does not exist.",
    )
    assert_failure(
        await other_api.post(f"/project/{project['id']}/version/{v1}/note", json={"note": "x"}),
        400,
        "Version does not exist.",
    )
    assert (await api.post(f"/project/{project['id']}/version/{v1}/note", json={})).status_code == 400


async def test_delete_version(api):
    project = await create_project(api)
    v1 = project["versions"][0]["id"]
    v2 = (await api.post(f"/project/{project['id']}/version", json={"parent": v1})).json()["data"]["id"]

    r = await api.delete(f"/project/{project['id']}/version/{v1}")

    assert r.json() == {"data": True, "errors": [], "status": "success"}
    assert [v["id"] for v in (await api.get("/projects/")).json()["data"][0]["versions"]] == [v2]
    await api.delete(f"/project/{project['id']}/version/{v2}")
    assert (await api.get("/projects/")).json()["data"] == []


async def test_delete_version_errors(api, other_api):
    project = await create_project(api)
    v1 = project["versions"][0]["id"]
    other_project = await create_project(api, "other")

    assert_failure(await api.delete(f"/project/{project['id']}/version/nonexistent"), 400, "Version does not exist.")
    assert_failure(await api.delete(f"/project/{other_project['id']}/version/{v1}"), 400, "Version does not exist.")
    assert_failure(await api.delete("/project/999/version/x"), 400, "Version does not exist.")
    assert_failure(await other_api.delete(f"/project/{project['id']}/version/{v1}"), 400, "Version does not exist.")
    assert len((await api.get("/projects/")).json()["data"]) == 2


async def test_promote_version_creates_a_new_project_with_the_state_and_files(api, engine):
    project = await create_project(api, "original")
    v1 = project["versions"][0]["id"]
    await save_state(api, project)
    await add_file(engine, v1)

    r = await api.post(f"/project/{project['id']}/version/{v1}/promote", json={"name": "promoted", "note": "vn"})

    assert r.status_code == 200
    promoted = r.json()["data"]
    assert (promoted["name"], promoted["uploaded"], promoted["sharedBy"], promoted["note"]) == (
        "promoted",
        False,
        "",
        None,
    )
    [version] = promoted["versions"]
    assert (version["versionNumber"], version["note"]) == (1, "vn")
    details = (await api.get(f"/project/{promoted['id']}/version/{version['id']}")).json()["data"]
    assert details["state"] == STATE
    assert details["files"]["pjnz"]["hash"] == "abc123"
    assert len((await api.get("/projects/")).json()["data"]) == 2


async def test_promote_version_without_a_name_is_rejected(api):
    project = await create_project(api)

    r = await api.post(f"/project/{project['id']}/version/x/promote", json={})

    assert r.status_code == 400
