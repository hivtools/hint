"""Project versions: create, state, open, note, delete, promote."""
from __future__ import annotations

import json

import pytest

from hintcontract.flows import SUPPORT_USER, TEST_USER, create_project, login_and_open, upload

STATE = json.dumps({"datasets": {}, "model_fit": {"id": "abc"}, "step": 3})


def setup_project(scn, with_state=True, with_file=False):
    a = login_and_open(scn, "A", project=False)
    p = create_project(a, "P", "pnote").data
    v1 = p["versions"][0]["id"]
    if with_file:
        upload(a, "pjnz")
    if with_state:
        a.post(f"/project/{p['id']}/version/{v1}/state", content_type="application/json", raw_body=STATE.encode(),
               name="save state")
    return a, p, v1


# ------------------------------------------------------------------------------------------------ new version
def test_new_version_copies_files_and_state(scn):
    a, p, v1 = setup_project(scn, with_file=True)
    r = a.post(f"/project/{p['id']}/version", json={"parent": v1, "note": "second"}, name="new version")
    assert r.status == 200
    a.get("/baseline/pjnz/", name="new session version has the file")
    a.get("/project/current", name="current is v2")
    v2 = r.data["id"]
    a.get(f"/project/{p['id']}/version/{v2}", name="state copied")
    scn.db_rows("project_version")
    scn.db_rows("version_file")


def test_new_version_without_note_and_numbering(scn):
    a, p, v1 = setup_project(scn)
    for i in range(3):
        a.post(f"/project/{p['id']}/version", json={"parent": v1}, name=f"version {i + 2}")
    a.get("/projects/", name="versions numbered 1..4, newest first")


def test_new_version_ignores_parameters_in_the_query_string(scn):
    a, p, v1 = setup_project(scn)
    a.post(f"/project/{p['id']}/version", params={"parent": v1, "note": "from query"}, name="query string only")
    a.post(f"/project/{p['id']}/version", params={"note": "from query"}, json={"parent": v1}, name="note in the query")
    a.post(f"/project/{p['id']}/version", form={"parent": v1}, name="form body is not accepted")


def test_new_version_errors(scn):
    a, p, v1 = setup_project(scn)
    other = create_project(a, "other project").data
    a.post(f"/project/{p['id']}/version", json={}, name="parent missing")
    a.post(f"/project/{p['id']}/version", name="no body")
    a.post(f"/project/{p['id']}/version", json={"parent": "nonexistent"}, name="unknown parent")
    a.post(f"/project/{other['id']}/version", json={"parent": v1}, name="parent belongs to another project")
    a.post("/project/999/version", json={"parent": v1}, name="unknown project")
    for lang in ("fr", "pt"):
        a.post(f"/project/{p['id']}/version", json={"parent": "nonexistent"}, headers={"Accept-Language": lang},
               name=f"unknown parent in {lang}")


def test_new_version_of_someone_elses_project(scn):
    a, p, v1 = setup_project(scn)
    b = login_and_open(scn, "B", user=SUPPORT_USER)
    b.post(f"/project/{p['id']}/version", json={"parent": v1}, name="B copies A's version")
    a.get("/projects/", name="A's project unchanged")


def test_failed_new_version_leaves_the_tab_on_its_version(scn):
    a, p, v1 = setup_project(scn)
    a.post(f"/project/{p['id']}/version", json={"parent": "nonexistent"}, name="failing copy")
    a.get("/project/current", name="the tab is still on the first version")
    upload(a, "pjnz", name="uploads still work")


@pytest.mark.quirk
@pytest.mark.legacy_session
def test_failed_new_version_leaves_session_pointing_at_a_nonexistent_version(scn):
    """quirk (temporary session fallback, a tab that sends no X-Version-Id): the session version id is switched BEFORE
    the copy; when the copy fails the session is broken (current project null, uploads fail with 500) until another
    version is opened."""
    a, p, v1 = setup_project(scn)
    a.use_version_header = False
    a.post(f"/project/{p['id']}/version", json={"parent": "nonexistent"}, name="failing copy")
    a.get("/project/current", name="current project is null")
    upload(a, "pjnz", name="upload now fails")
    a.open_app(name="opening the app does not repair the session version")
    a.get(f"/project/{p['id']}/version/{v1}", name="opening a real version repairs the session")
    upload(a, "pjnz", name="upload works again")


# ------------------------------------------------------------------------------------------------ state
def test_save_and_load_state(scn):
    a, p, v1 = setup_project(scn, with_state=False)
    r = a.post(f"/project/{p['id']}/version/{v1}/state", content_type="application/json", raw_body=STATE.encode(),
               name="save state")
    assert r.status == 200
    a.get(f"/project/{p['id']}/version/{v1}", name="state is returned as a string")
    a.post(f"/project/{p['id']}/version/{v1}/state", content_type="application/json", raw_body=b'{"a": 2}',
           name="save state again")
    a.get(f"/project/{p['id']}/version/{v1}", name="state overwritten")
    scn.db_rows("project_version")


def test_save_state_stores_the_body_verbatim(scn):
    a, p, v1 = setup_project(scn, with_state=False)
    a.post(f"/project/{p['id']}/version/{v1}/state", content_type="text/plain", raw_body="not even json".encode(),
           name="plain text")
    a.get(f"/project/{p['id']}/version/{v1}", name="returned as is")
    a.post(f"/project/{p['id']}/version/{v1}/state", content_type="application/json",
           raw_body='{"unicode": "café ☃", "n": 1.50}'.encode("utf-8"), name="unicode and number formatting")
    a.get(f"/project/{p['id']}/version/{v1}", name="verbatim")


def test_save_state_errors(scn):
    a, p, v1 = setup_project(scn, with_state=False)
    other = create_project(a, "other").data
    body = dict(content_type="application/json", raw_body=b"{}")
    a.post(f"/project/{p['id']}/version/nonexistent/state", name="unknown version", **body)
    a.post(f"/project/{other['id']}/version/{v1}/state", name="version in another project", **body)
    a.post("/project/999/version/x/state", name="unknown project", **body)
    a.post(f"/project/{p['id']}/version/{v1}/state", name="no body")
    a.post(f"/project/{p['id']}/version/{v1}/state", form={"a": "b"}, name="form body")
    for lang in ("fr", "pt"):
        a.post(f"/project/{p['id']}/version/nonexistent/state", headers={"Accept-Language": lang},
               name=f"unknown version in {lang}", **body)
    b = login_and_open(scn, "B", user=SUPPORT_USER)
    b.post(f"/project/{p['id']}/version/{v1}/state", name="other user's version", **body)


# ------------------------------------------------------------------------------------------------ open version
def test_open_version_returns_state_and_files_and_switches_session(scn):
    a, p, v1 = setup_project(scn, with_file=True)
    v2 = a.post(f"/project/{p['id']}/version", json={"parent": v1}, name="v2").data["id"]
    a.delete("/baseline/pjnz/", name="remove file from v2 (the current session version)")
    a.get("/baseline/pjnz/", name="v2 has no file")
    r = a.get(f"/project/{p['id']}/version/{v1}", name="open v1")
    assert r.status == 200
    a.get("/baseline/pjnz/", name="session now shows v1's file")
    a.get("/project/current", name="current is v1")


def test_open_version_errors(scn):
    a, p, v1 = setup_project(scn)
    other = create_project(a, "other").data
    a.get(f"/project/{p['id']}/version/nonexistent", name="unknown version")
    a.get(f"/project/{other['id']}/version/{v1}", name="version of another project")
    a.get("/project/999/version/x", name="unknown project")
    for lang in ("fr", "pt"):
        a.get(f"/project/{p['id']}/version/nonexistent", headers={"Accept-Language": lang}, name=f"{lang}")
    b = login_and_open(scn, "B", user=SUPPORT_USER)
    b.get(f"/project/{p['id']}/version/{v1}", name="other user's version")
    b.get("/project/current", name="B's session unchanged")


@pytest.mark.quirk
def test_open_version_without_saved_state_is_a_500(scn):
    """quirk: a version whose state was never saved cannot be opened (null state -> unexpected error)."""
    a, p, v1 = setup_project(scn, with_state=False)
    a.get(f"/project/{p['id']}/version/{v1}", name="open version without state")
    a.get("/project/current", name="session version was not switched? (check)")


@pytest.mark.quirk
def test_open_soft_deleted_version_still_works(scn):
    """quirk: GET version does not look at the deleted flag."""
    a, p, v1 = setup_project(scn)
    v2 = a.post(f"/project/{p['id']}/version", json={"parent": v1}).data["id"]
    a.delete(f"/project/{p['id']}/version/{v2}", name="delete v2")
    a.get(f"/project/{p['id']}/version/{v2}", name="open the deleted version")


def test_session_files_flow_after_opening_a_version(scn):
    """What the frontend does when a saved version is opened: GET version, then POST its files to the session."""
    a, p, v1 = setup_project(scn, with_file=True)
    details = a.get(f"/project/{p['id']}/version/{v1}", name="open").data
    b = login_and_open(scn, "B")
    b.post("/session/files/", json=details["files"], name="post the files to a fresh session")
    b.get("/baseline/pjnz/", name="fresh session now has the file")
    scn.db_rows("version_file")


# ------------------------------------------------------------------------------------------------ note
def test_update_version_note(scn):
    a, p, v1 = setup_project(scn)
    a.post(f"/project/{p['id']}/version/{v1}/note", json={"note": "new version note"}, name="set note")
    a.post(f"/project/{p['id']}/version/{v1}/note", json={"note": ""}, name="empty note")
    a.get("/projects/")
    scn.db_rows("project_version")


def test_update_version_note_errors(scn):
    a, p, v1 = setup_project(scn)
    other = create_project(a, "other").data
    a.post(f"/project/{p['id']}/version/nonexistent/note", json={"note": "x"}, name="unknown version")
    a.post(f"/project/{other['id']}/version/{v1}/note", json={"note": "x"}, name="wrong project")
    a.post(f"/project/{p['id']}/version/{v1}/note", json={}, name="missing note")
    b = login_and_open(scn, "B", user=SUPPORT_USER)
    b.post(f"/project/{p['id']}/version/{v1}/note", json={"note": "x"}, name="other user")
    a.post(f"/project/{p['id']}/version/nonexistent/note", json={"note": "x"}, headers={"Accept-Language": "fr"},
           name="unknown version in french")


# ------------------------------------------------------------------------------------------------ delete
def test_delete_version(scn):
    a, p, v1 = setup_project(scn)
    v2 = a.post(f"/project/{p['id']}/version", json={"parent": v1}, name="v2").data["id"]
    a.delete(f"/project/{p['id']}/version/{v1}", name="delete a non-current version")
    a.get("/project/current", name="session version unchanged")
    a.delete(f"/project/{p['id']}/version/{v2}", name="delete the current version")
    a.get("/project/current", name="session version cleared")
    a.get("/projects/", name="project has no live versions so is not listed")
    scn.db_rows("project_version")


def test_delete_version_errors(scn):
    a, p, v1 = setup_project(scn)
    other = create_project(a, "other").data
    a.delete(f"/project/{p['id']}/version/nonexistent", name="unknown version")
    a.delete(f"/project/{other['id']}/version/{v1}", name="wrong project")
    a.delete("/project/999/version/x", name="unknown project")
    a.delete(f"/project/{p['id']}/version/{v1}", name="delete")
    a.delete(f"/project/{p['id']}/version/{v1}", name="delete again")
    b = login_and_open(scn, "B", user=SUPPORT_USER)
    b.delete(f"/project/{p['id']}/version/{v1}", name="other user")
    a.delete(f"/project/{p['id']}/version/nonexistent", headers={"Accept-Language": "pt"}, name="unknown in pt")


# ------------------------------------------------------------------------------------------------ promote
def test_promote_version_creates_a_new_project(scn):
    a, p, v1 = setup_project(scn, with_file=True)
    r = a.post(f"/project/{p['id']}/version/{v1}/promote", json={"name": "promoted", "note": "version note"},
               name="promote")
    assert r.status == 200
    a.get("/projects/", name="two projects")
    a.get("/project/current", name="promote does not change the session version")
    scn.db_rows("project")
    scn.db_rows("project_version")
    scn.db_rows("version_file")


def test_promote_version_without_note(scn):
    a, p, v1 = setup_project(scn)
    a.post(f"/project/{p['id']}/version/{v1}/promote", json={"name": "promoted"}, name="promote without note")
    a.post(f"/project/{p['id']}/version/{v1}/promote", json={}, name="promote without name")


@pytest.mark.quirk
def test_promote_does_not_check_version_or_ownership(scn):
    """quirk: promote never validates the version/project: an unknown version id yields an empty new project and
    another user's version can be copied into your own project."""
    a, p, v1 = setup_project(scn, with_file=True)
    b = login_and_open(scn, "B", user=SUPPORT_USER)
    b.post(f"/project/{p['id']}/version/{v1}/promote", json={"name": "stolen copy"}, name="B promotes A's version")
    b.post("/project/999/version/nonexistent/promote", json={"name": "from nothing"}, name="unknown version")
    b.get("/projects/", name="B has two projects")
    scn.db_rows("version_file")
    scn.db_rows("project_version")
