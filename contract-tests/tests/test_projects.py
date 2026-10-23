"""Projects: create / list / current / rename / note / clone / delete, and the user-exists helper."""
from __future__ import annotations

import pytest

from hintcontract.flows import SUPPORT_USER, TEST_USER, create_project, login_and_open, upload


def two_users(scn):
    a = login_and_open(scn, "A")
    b = login_and_open(scn, "B", user=SUPPORT_USER)
    return a, b


# ------------------------------------------------------------------------------------------------------ create
def test_create_project_full(scn):
    a = login_and_open(scn)
    r = create_project(a, "My project", "my note")
    assert r.status == 200
    a.get("/project/current", name="current project is the new one")
    a.get("/projects/", name="list contains it")
    scn.db_rows("project")
    scn.db_rows("project_version")


def test_create_project_without_note_and_is_uploaded_variants(scn):
    a = login_and_open(scn)
    create_project(a, "no note", note=None)
    a.post("/project/", form={"name": "uploaded", "note": "n", "isUploaded": "true"}, name="isUploaded=true")
    a.post("/project/", form={"name": "not uploaded", "isUploaded": "false"}, name="isUploaded=false")
    a.get("/projects/", name="list shows isUploaded as 'uploaded'")
    scn.db_rows("project")


@pytest.mark.quirk
def test_create_project_response_drops_note_and_reports_uploaded_null(scn):
    """quirk: POST /project/ response has note=null (the note IS saved) and uses key `uploaded`, null when omitted."""
    a = login_and_open(scn)
    create_project(a, "p", "saved note")
    a.get("/project/current", name="note is stored although the create response had none")


def test_create_project_parameters_may_come_from_the_query_string(scn):
    a = login_and_open(scn)
    a.post("/project/", params={"name": "from query"}, name="name in query string")


def test_create_project_missing_or_bad_parameters(scn):
    a = login_and_open(scn)
    a.post("/project/", name="no name")
    a.post("/project/", form={"name": "x", "isUploaded": "maybe"}, name="isUploaded not a boolean")
    a.post("/project/", json={"name": "json body"}, name="json body is not accepted as parameters")
    a.post("/project/", form={"name": ""}, name="empty name is accepted")
    a.get("/projects/")


def test_create_project_as_guest_is_401(scn):
    a = scn.client("A")
    a.open_app()
    a.post("/project/", form={"name": "p"}, name="guest create")
    a.post("/project/1/rename", form={"name": "p"}, name="guest rename")
    a.post("/project/1/note", form={"note": "p"}, name="guest note")
    a.post("/project/1/clone", form={"emails": SUPPORT_USER}, name="guest clone")
    a.delete("/project/1", name="guest delete")
    a.post("/project/1/version/", params={"parent": "x"}, name="guest new version")
    a.post("/project/1/version/x/state", content_type="application/json", raw_body=b"{}", name="guest state")
    a.post("/project/1/version/x/promote", form={"name": "p"}, name="guest promote")
    a.post("/project/1/version/x/note", form={"note": "p"}, name="guest version note")
    a.get("/project/1/version/x", name="guest get version")
    a.delete("/project/1/version/x", name="guest delete version")
    a.get("/project/current", name="guest current")


# ------------------------------------------------------------------------------------------------------ list
def test_list_projects_empty(scn):
    a = login_and_open(scn)
    a.get("/projects/")
    a.get("/projects", name="no trailing slash")


def test_list_projects_ordering_and_isolation_between_users(scn):
    a, b = two_users(scn)
    create_project(a, "first")
    create_project(a, "second")
    create_project(b, "bees")
    a.get("/projects/", name="A sees only own, newest first")
    b.get("/projects/", name="B sees only own")


def test_list_projects_hides_deleted_versions_and_projects(scn):
    a = login_and_open(scn)
    p1 = create_project(a, "keep").data
    p2 = create_project(a, "gone").data["id"]
    a.delete(f"/project/{p2}", name="delete second project")
    a.get("/projects/", name="deleted project not listed")
    v2 = a.post(f"/project/{p1['id']}/version/", params={"parent": p1["versions"][0]["id"]}, name="new version").data
    a.get("/projects/", name="two versions")
    a.delete(f"/project/{p1['id']}/version/{v2['id']}", name="delete one version")
    a.get("/projects/", name="one version left")
    scn.db_rows("project_version")


# ------------------------------------------------------------------------------------------------------ current
def test_current_project_none_for_fresh_logged_in_session(scn):
    a = login_and_open(scn)
    a.get("/project/current")


def test_current_project_is_null_for_version_owned_by_somebody_else(scn):
    a, b = two_users(scn)
    p = create_project(a, "A's project").data
    vid = p["versions"][0]["id"]
    # B loads A's version id: B is not the owner so the load fails and the session version is unchanged
    b.get(f"/project/{p['id']}/version/{vid}", name="B tries to open A's version")
    b.get("/project/current", name="B still has no current project")


def test_current_project_follows_new_version(scn):
    a = login_and_open(scn)
    p = create_project(a, "p").data
    v1 = p["versions"][0]["id"]
    v2 = a.post(f"/project/{p['id']}/version/", params={"parent": v1, "note": "second"}, name="new version").data
    a.get("/project/current", name="current is the second version")
    a.get(f"/project/{p['id']}/version/{v1}", name="open first version")
    a.get("/project/current", name="current is the first version again")


# ------------------------------------------------------------------------------------------------------ rename/note
def test_rename_project(scn):
    a = login_and_open(scn)
    p = create_project(a, "old", "old note").data
    a.post(f"/project/{p['id']}/rename", form={"name": "new", "note": "new note"}, name="rename with note")
    a.get("/projects/")
    a.post(f"/project/{p['id']}/rename", form={"name": "newer"}, name="rename without note")
    a.get("/projects/", name="note cleared")
    scn.db_rows("project")


@pytest.mark.quirk
def test_rename_without_note_clears_the_note(scn):
    """quirk: rename sets the note to the (optional) note parameter, so omitting it wipes the stored note."""
    a = login_and_open(scn)
    p = create_project(a, "old", "keep me?").data
    a.post(f"/project/{p['id']}/rename", form={"name": "renamed"})
    scn.db_rows("project")


def test_rename_project_errors(scn):
    a, b = two_users(scn)
    p = create_project(a, "mine").data
    a.post("/project/999/rename", form={"name": "x"}, name="unknown project")
    b.post(f"/project/{p['id']}/rename", form={"name": "stolen"}, name="other user's project")
    a.post(f"/project/{p['id']}/rename", name="missing name")
    a.post("/project/abc/rename", form={"name": "x"}, name="non numeric project id")
    for lang in ("fr", "pt"):
        a.post("/project/999/rename", form={"name": "x"}, headers={"Accept-Language": lang}, name=f"unknown in {lang}")
    scn.db_rows("project")


def test_update_project_note(scn):
    a = login_and_open(scn)
    p = create_project(a, "p", "one").data
    a.post(f"/project/{p['id']}/note", form={"note": "two"}, name="update note")
    a.post(f"/project/{p['id']}/note", form={"note": ""}, name="empty note")
    a.get("/projects/")


def test_update_project_note_errors(scn):
    a, b = two_users(scn)
    p = create_project(a, "p", "one").data
    a.post("/project/999/note", form={"note": "x"}, name="unknown project")
    b.post(f"/project/{p['id']}/note", form={"note": "x"}, name="other user's project")
    a.post(f"/project/{p['id']}/note", name="missing note")
    scn.db_rows("project")


# ------------------------------------------------------------------------------------------------------ delete
def test_delete_project_is_soft(scn):
    a = login_and_open(scn)
    p = create_project(a, "p").data
    a.post(f"/project/{p['id']}/version/", params={"parent": p["versions"][0]["id"]}, name="second version")
    r = a.delete(f"/project/{p['id']}")
    assert r.status == 200
    a.get("/projects/", name="project no longer listed")
    scn.db_rows("project")
    scn.db_rows("project_version")


def test_delete_current_project_resets_session_version(scn):
    a = login_and_open(scn)
    p = create_project(a, "p").data
    a.delete(f"/project/{p['id']}", name="delete the current project")
    a.get("/project/current", name="no current project")
    a.get("/baseline/pjnz/", name="session still usable")
    a.open_app(name="open app again")
    upload(a, "pjnz")
    scn.db_rows("project_version")
    scn.db_rows("version_file")


def test_delete_other_project_keeps_session_version(scn):
    a = login_and_open(scn)
    p1 = create_project(a, "p1").data
    p2 = create_project(a, "p2").data      # p2 is current
    a.delete(f"/project/{p1['id']}", name="delete the non-current project")
    a.get("/project/current", name="current is still p2")


@pytest.mark.quirk
def test_delete_project_fails_with_400_when_session_has_no_current_project_but_still_deletes(scn):
    """quirk: the project is soft-deleted first, then looking up the *current* project throws projectDoesNotExist
    when the session version does not belong to a project of this user."""
    a = login_and_open(scn)
    p = create_project(a, "p").data
    b = scn.client("A2")
    b.login()
    b.open_app()
    r = b.delete(f"/project/{p['id']}", name="delete from a different session")
    assert r.status == 400
    a.get("/projects/", name="but the project is gone")
    scn.db_rows("project_version")


def test_delete_project_errors(scn):
    a, b = two_users(scn)
    p = create_project(a, "p").data
    a.delete("/project/999", name="unknown project")
    b.delete(f"/project/{p['id']}", name="other user's project")
    a.delete("/project/abc", name="non numeric id")
    a.delete(f"/project/{p['id']}", name="delete")
    a.delete(f"/project/{p['id']}", name="delete again")
    for lang in ("fr", "pt"):
        a.delete("/project/999", headers={"Accept-Language": lang}, name=f"unknown in {lang}")
    scn.db_rows("project_version")


# ------------------------------------------------------------------------------------------------------ clone
def test_clone_project_to_another_user(scn):
    a, b = two_users(scn)
    p = create_project(a, "shared", "note").data
    a.post(f"/project/{p['id']}/version/", params={"parent": p["versions"][0]["id"], "note": "v2"}, name="v2")
    a.post(f"/project/{p['id']}/clone", form={"emails": SUPPORT_USER}, name="clone to B")
    b.get("/projects/", name="B has the copy with sharedBy and all versions")
    a.get("/projects/", name="A unchanged")
    scn.db_rows("project")
    scn.db_rows("project_version")


def test_clone_project_to_multiple_users_and_self(scn):
    a, b = two_users(scn)
    p = create_project(a, "shared").data
    a.post(f"/project/{p['id']}/clone", form={"emails": [SUPPORT_USER, TEST_USER]}, name="repeated parameter")
    a.post(f"/project/{p['id']}/clone", form={"emails": f"{SUPPORT_USER},{TEST_USER}"}, name="comma separated")
    a.get("/projects/", name="A now has copies of its own project")
    b.get("/projects/", name="B has two copies")
    scn.db_rows("project")


def test_clone_project_unknown_email_changes_nothing(scn):
    a, b = two_users(scn)
    p = create_project(a, "shared").data
    r = a.post(f"/project/{p['id']}/clone", form={"emails": [SUPPORT_USER, "nobody@example.com"]},
               name="one good one unknown")
    assert r.status == 400
    b.get("/projects/", name="B got nothing")
    a.post(f"/project/{p['id']}/clone", form={"emails": "nobody@example.com"}, headers={"Accept-Language": "fr"},
           name="unknown in french")
    scn.db_rows("project")


def test_clone_project_other_errors(scn):
    a, b = two_users(scn)
    p = create_project(a, "mine").data
    a.post(f"/project/{p['id']}/clone", name="no emails parameter")
    a.post(f"/project/{p['id']}/clone", form={"emails": "not-an-email"}, name="email without @")
    a.post("/project/999/clone", form={"emails": SUPPORT_USER}, name="unknown project")
    b.post(f"/project/{p['id']}/clone", form={"emails": TEST_USER}, name="cloning someone else's project")
    a.post(f"/project/{p['id']}/clone", form={"emails": ""}, name="empty emails")
    scn.db_rows("project")


def test_clone_email_matching_is_case_insensitive(scn):
    a, b = two_users(scn)
    p = create_project(a, "shared").data
    a.post(f"/project/{p['id']}/clone", form={"emails": SUPPORT_USER.upper()})
    b.get("/projects/")


@pytest.mark.quirk
def test_clone_includes_soft_deleted_versions(scn):
    """quirk: cloning copies every version of the project including ones the owner deleted."""
    a, b = two_users(scn)
    p = create_project(a, "shared").data
    v1 = p["versions"][0]["id"]
    v2 = a.post(f"/project/{p['id']}/version/", params={"parent": v1}).data
    a.delete(f"/project/{p['id']}/version/{v2['id']}", name="delete v2")
    a.post(f"/project/{p['id']}/clone", form={"emails": SUPPORT_USER})
    b.get("/projects/", name="B sees ...")
    scn.db_rows("project_version")


def test_clone_copies_files_and_state(scn):
    a, b = two_users(scn)
    p = create_project(a, "with files").data
    vid = p["versions"][0]["id"]
    upload(a, "pjnz")
    a.post(f"/project/{p['id']}/version/{vid}/state", content_type="application/json", raw_body=b'{"x": 1}', name="state")
    a.post(f"/project/{p['id']}/clone", form={"emails": SUPPORT_USER})
    scn.db_rows("version_file")
    scn.db_rows("project_version")


# ------------------------------------------------------------------------------------------------------ user exists
def test_user_exists(scn):
    a = login_and_open(scn)
    a.get(f"/user/{TEST_USER}/exists", name="known")
    a.get(f"/user/{TEST_USER.upper()}/exists", name="known, other case")
    a.get("/user/nobody@example.com/exists", name="unknown")
    a.get("/user/guest/exists", name="the guest user")
    a.get("/user/not-an-email/exists", name="no @ sign")
    a.get("/user/not-an-email/exists", headers={"Accept-Language": "fr"}, name="no @ sign, french")
