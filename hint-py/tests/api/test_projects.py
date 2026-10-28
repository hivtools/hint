"""The project endpoints, through the whole app. These follow the scenarios in contract-tests/tests/test_projects.py
(which record the behaviour of the Kotlin app)."""

import re
from datetime import datetime

import pytest

from tests.api.helpers import add_file, assert_failure, create_project, make_client, save_state, set_updated
from tests.support import OTHER_USER, USER

UNEXPECTED_ERROR_TEXT = "show them this code"


# ------------------------------------------------------------------------------------------------------ create
async def test_create_project(api):
    r = await api.post("/project", json={"name": "My project", "note": "my note"})

    assert r.status_code == 200
    body = r.json()
    assert (body["errors"], body["status"]) == ([], "success")
    project = body["data"]
    # As in Kotlin: the response has no note, calls the flag `uploaded` and has null for it when it was not sent
    assert project["name"] == "My project"
    assert project["note"] is None
    assert project["sharedBy"] == ""
    assert project["uploaded"] is None
    [version] = project["versions"]
    assert version["versionNumber"] == 1
    assert version["note"] is None
    assert re.fullmatch(r"[0-9a-f-]{36}", version["id"])
    # but the note is saved
    [listed] = (await api.get("/projects/")).json()["data"]
    assert listed["note"] == "my note"
    assert listed["uploaded"] is None
    assert listed["sharedBy"] is None


async def test_create_project_is_uploaded(api):
    await api.post("/project", json={"name": "yes", "isUploaded": True})
    await api.post("/project", json={"name": "no", "isUploaded": False})

    flags = {p["name"]: p["uploaded"] for p in (await api.get("/projects/")).json()["data"]}
    assert flags == {"yes": True, "no": False}


@pytest.mark.parametrize(
    "request_kwargs",
    [
        {},  # no body
        {"json": {}},  # no name
        {"json": {"name": "x", "isUploaded": "maybe"}},
        {"params": {"name": "from the query string"}},
    ],
)
async def test_create_project_with_a_bad_request(api, request_kwargs):
    r = await api.post("/project", **request_kwargs)

    assert r.status_code == 400
    [error] = r.json()["errors"]
    assert error["error"] == "OTHER_ERROR"
    assert re.search(r"show them this code: u[0-9a-f]{8}\. ", error["detail"])
    assert "naomi-support@imperial.ac.uk" in error["detail"]
    assert (await api.get("/projects/")).json()["data"] == []


async def test_create_project_with_a_form_body_is_an_unsupported_media_type(api):
    r = await api.post("/project", data={"name": "form body"})

    assert r.status_code == 415
    assert UNEXPECTED_ERROR_TEXT in r.json()["errors"][0]["detail"]


async def test_create_project_with_an_empty_name(api):
    assert (await api.post("/project", json={"name": ""})).status_code == 200


# ------------------------------------------------------------------------------------------------------ list
async def test_list_projects_when_there_are_none(api):
    assert (await api.get("/projects/")).json() == {"data": [], "errors": [], "status": "success"}


async def test_list_projects_are_the_users_own_and_newest_first(api, other_api, engine):
    first = await create_project(api, "first")
    second = await create_project(api, "second")
    await create_project(other_api, "theirs")
    await set_updated(engine, first["versions"][0]["id"], datetime(2026, 1, 1))
    await set_updated(engine, second["versions"][0]["id"], datetime(2026, 1, 2))

    assert [p["name"] for p in (await api.get("/projects/")).json()["data"]] == ["second", "first"]
    assert [p["name"] for p in (await other_api.get("/projects/")).json()["data"]] == ["theirs"]


async def test_list_projects_hides_deleted_versions_and_projects(api):
    keep = await create_project(api, "keep")
    gone = await create_project(api, "gone")
    assert (await api.delete(f"/project/{gone['id']}")).status_code == 200
    parent = keep["versions"][0]["id"]
    v2 = (await api.post(f"/project/{keep['id']}/version", json={"parent": parent})).json()["data"]
    assert (await api.delete(f"/project/{keep['id']}/version/{v2['id']}")).status_code == 200

    [listed] = (await api.get("/projects/")).json()["data"]
    assert listed["name"] == "keep"
    assert [v["id"] for v in listed["versions"]] == [parent]


# ------------------------------------------------------------------------------------------------------ current
async def test_current_project_is_null_without_a_version(api):
    await create_project(api)

    r = await api.get("/project/current")

    assert r.json() == {"data": {"project": None, "version": None}, "errors": [], "status": "success"}


async def test_current_project_is_the_one_the_tab_is_working_on(api):
    project = await create_project(api, "p")
    v1 = project["versions"][0]["id"]
    v2 = (await api.post(f"/project/{project['id']}/version", json={"parent": v1, "note": "second"})).json()["data"]

    for version_id in (v1, v2["id"]):
        async with make_client(USER, version_id) as tab:
            data = (await tab.get("/project/current")).json()["data"]
        assert data["version"]["id"] == version_id
        assert data["project"]["id"] == project["id"]
        assert data["project"]["name"] == "p"
        # oldest version first
        assert [v["versionNumber"] for v in data["project"]["versions"]] == [1, 2]


async def test_current_project_is_null_for_a_version_that_is_not_the_users(api, other_api):
    version_id = (await create_project(api))["versions"][0]["id"]

    async with make_client(OTHER_USER, version_id) as tab:
        assert (await tab.get("/project/current")).json()["data"] == {"project": None, "version": None}
    async with make_client(USER, "unknown") as tab:
        assert (await tab.get("/project/current")).json()["data"] == {"project": None, "version": None}


# ------------------------------------------------------------------------------------------------------ rename/note
async def test_rename_project(api):
    project = await create_project(api, "old", "old note")

    r = await api.post(f"/project/{project['id']}/rename", json={"name": "new", "note": "new note"})

    assert r.json() == {"data": True, "errors": [], "status": "success"}
    [listed] = (await api.get("/projects/")).json()["data"]
    assert (listed["name"], listed["note"]) == ("new", "new note")


async def test_rename_project_without_a_note_clears_the_note(api):
    # A quirk of the Kotlin app that is kept (contract test test_rename_without_note_clears_the_note)
    project = await create_project(api, "old", "keep me?")

    await api.post(f"/project/{project['id']}/rename", json={"name": "renamed"})

    assert (await api.get("/projects/")).json()["data"][0]["note"] is None


async def test_rename_project_errors(api, other_api):
    project = await create_project(api)

    assert_failure(await api.post("/project/999/rename", json={"name": "x"}), 400, "Project does not exist.")
    assert_failure(
        await other_api.post(f"/project/{project['id']}/rename", json={"name": "stolen"}),
        400,
        "Project does not exist.",
    )
    assert (await api.post(f"/project/{project['id']}/rename", json={})).status_code == 400
    assert (await api.post("/project/abc/rename", json={"name": "x"})).status_code == 400
    assert (await api.get("/projects/")).json()["data"][0]["name"] == "p"


@pytest.mark.parametrize(
    ("accept_language", "detail"),
    [
        ("fr", "Le projet n'existe pas."),
        ("pt", "O projeto não existe."),
        ("fr-FR", "Le projet n'existe pas."),
        ("pt-BR,pt;q=0.9,en;q=0.8", "O projeto não existe."),
        ("de", "Project does not exist."),
        ("", "Project does not exist."),
        ("garbage", "Project does not exist."),
    ],
)
async def test_errors_are_translated(api, accept_language, detail):
    r = await api.post("/project/999/rename", json={"name": "x"}, headers={"Accept-Language": accept_language})

    assert_failure(r, 400, detail)


async def test_update_project_note(api):
    project = await create_project(api, "p", "one")

    assert (await api.post(f"/project/{project['id']}/note", json={"note": "two"})).status_code == 200
    assert (await api.get("/projects/")).json()["data"][0]["note"] == "two"
    await api.post(f"/project/{project['id']}/note", json={"note": ""})
    assert (await api.get("/projects/")).json()["data"][0]["note"] == ""


async def test_update_project_note_errors(api, other_api):
    project = await create_project(api, "p", "one")

    assert_failure(await api.post("/project/999/note", json={"note": "x"}), 400, "Project does not exist.")
    assert_failure(
        await other_api.post(f"/project/{project['id']}/note", json={"note": "x"}), 400, "Project does not exist."
    )
    assert (await api.post(f"/project/{project['id']}/note", json={})).status_code == 400
    assert (await api.get("/projects/")).json()["data"][0]["note"] == "one"


# ------------------------------------------------------------------------------------------------------ delete
async def test_delete_project_is_a_soft_delete(api):
    project = await create_project(api)
    v1 = project["versions"][0]["id"]
    await api.post(f"/project/{project['id']}/version", json={"parent": v1})

    r = await api.delete(f"/project/{project['id']}")

    assert r.json() == {"data": True, "errors": [], "status": "success"}
    assert (await api.get("/projects/")).json()["data"] == []
    # nothing is removed, the project can still be found by id
    assert (await api.post(f"/project/{project['id']}/rename", json={"name": "still there"})).status_code == 200


async def test_delete_project_errors(api, other_api):
    project = await create_project(api)

    assert_failure(await api.delete("/project/999"), 400, "Project does not exist.")
    assert_failure(await other_api.delete(f"/project/{project['id']}"), 400, "Project does not exist.")
    assert (await api.delete("/project/abc")).status_code == 400
    assert len((await api.get("/projects/")).json()["data"]) == 1


# ------------------------------------------------------------------------------------------------------ clone
async def test_clone_project_to_another_user(api, other_api, engine):
    project = await create_project(api, "shared", "note")
    v1 = project["versions"][0]["id"]
    await save_state(api, project)
    await add_file(engine, v1)
    v2 = (await api.post(f"/project/{project['id']}/version", json={"parent": v1, "note": "v2"})).json()["data"]

    r = await api.post(f"/project/{project['id']}/clone", json={"emails": [OTHER_USER]})

    assert r.json() == {"data": None, "errors": [], "status": "success"}
    [copy] = (await other_api.get("/projects/")).json()["data"]
    assert (copy["name"], copy["sharedBy"], copy["uploaded"]) == ("shared", USER, False)
    assert copy["note"] is None
    # the version notes are not copied
    assert sorted((v["versionNumber"], v["note"]) for v in copy["versions"]) == [(1, None), (2, None)]
    assert {v["id"] for v in copy["versions"]}.isdisjoint({v1, v2["id"]})
    # the copies have their own state and files
    for version in copy["versions"]:
        details = (await other_api.get(f"/project/{copy['id']}/version/{version['id']}")).json()["data"]
        if version["versionNumber"] == 1:
            assert details["state"] == (await api.get(f"/project/{project['id']}/version/{v1}")).json()["data"]["state"]
            assert details["files"]["pjnz"]["filename"] == "spectrum.pjnz"
    assert len((await api.get("/projects/")).json()["data"]) == 1


async def test_clone_project_to_several_users_and_to_self(api, other_api):
    project = await create_project(api, "shared")

    await api.post(f"/project/{project['id']}/clone", json={"emails": [OTHER_USER, USER]})

    assert len((await api.get("/projects/")).json()["data"]) == 2
    assert len((await other_api.get("/projects/")).json()["data"]) == 1


async def test_clone_email_matching_ignores_case(api, other_api):
    project = await create_project(api, "shared")

    await api.post(f"/project/{project['id']}/clone", json={"emails": [OTHER_USER.upper()]})

    assert len((await other_api.get("/projects/")).json()["data"]) == 1


async def test_clone_to_an_unknown_email_changes_nothing(api, other_api):
    project = await create_project(api)

    r = await api.post(f"/project/{project['id']}/clone", json={"emails": [OTHER_USER, "nobody@example.com"]})

    assert_failure(r, 400, "User does not exist.")
    assert (await other_api.get("/projects/")).json()["data"] == []
    r = await api.post(
        f"/project/{project['id']}/clone",
        json={"emails": ["nobody@example.com"]},
        headers={"Accept-Language": "fr"},
    )
    assert_failure(r, 400, "L'utilisateur n'existe pas.")


async def test_clone_errors(api, other_api):
    project = await create_project(api)
    clone = f"/project/{project['id']}/clone"

    assert (await api.post(clone, json={})).status_code == 400
    assert (await api.post(clone, json={"emails": f"{OTHER_USER},{USER}"})).status_code == 400
    assert_failure(
        await api.post(clone, json={"emails": ["not-an-email"]}), 400, "Please provide a valid email address."
    )
    assert_failure(await api.post(clone, json={"emails": [""]}), 400, "Please provide a valid email address.")
    assert_failure(await api.post("/project/999/clone", json={"emails": [OTHER_USER]}), 400, "Project does not exist.")
    assert_failure(await other_api.post(clone, json={"emails": [USER]}), 400, "Project does not exist.")
    assert (await api.post(clone, json={"emails": []})).status_code == 200
    assert (await other_api.get("/projects/")).json()["data"] == []
