"""X-Version-Id: the version a tab works on is named by the tab, and the server checks that the user may use it.

The Vue app sends the header on every request, and so does a RecordedClient (see hintcontract/scenario.py), so most
tests in this suite already use it. These tests are about the header itself: it decides which version a request works
on, a user cannot use a version that is not theirs, a guest tab is given its own versions, and two tabs of one login do
not overwrite each other.

Kotlin still falls back to the version stored in the session when a request has no header, for a tab that was loaded
before the header existed. Those tests are marked `legacy_session`: the Python port does not need them.
"""
from __future__ import annotations

import pytest

from hintcontract.flows import SUPPORT_USER, create_project, guest_open, login_and_open, upload

VERSION = "X-Version-Id"


def second_tab(scn, first, name="B"):
    """Another tab of the same login: same cookies, no version open yet."""
    tab = scn.client(name)
    tab.raw.cookies.update(first.raw.cookies)
    return tab


# ------------------------------------------------------------------------------------------------ logged in user
def test_the_header_decides_which_version_a_request_works_on(scn):
    a = login_and_open(scn, project=False)
    p1 = create_project(a, "first").data
    v1 = p1["versions"][0]["id"]
    create_project(a, "second")            # the tab is now on the second project
    upload(a, "pjnz", headers={VERSION: v1}, name="upload with the first version in the header")
    a.get("/baseline/pjnz/", name="the tab's own version has no file")
    a.get("/baseline/pjnz/", headers={VERSION: v1}, name="the first version has it")
    scn.db_rows("version_file")


def test_two_tabs_of_one_login_do_not_overwrite_each_other(scn):
    a = login_and_open(scn, "A", project=False)
    b = second_tab(scn, a)
    create_project(a, "project of tab A")
    create_project(b, "project of tab B")
    upload(a, "pjnz")
    upload(b, "shape")
    a.get("/baseline/pjnz/", name="tab A has its Spectrum file")
    a.get("/baseline/shape/", name="tab A has no shape file")
    b.get("/baseline/shape/", name="tab B has its shape file")
    b.get("/baseline/pjnz/", name="tab B has no Spectrum file")
    a.get("/project/current", name="tab A is on its project")
    b.get("/project/current", name="tab B is on its project")
    scn.db_rows("version_file")


def test_a_version_of_another_user_is_refused(scn):
    a = login_and_open(scn, "A", project=False)
    va = create_project(a, "A's project").data["versions"][0]["id"]
    upload(a, "pjnz", name="A uploads to its own version")
    b = login_and_open(scn, "B", user=SUPPORT_USER)
    other = {VERSION: va}
    upload(b, "shape", headers=other, name="B uploads to A's version")
    b.get("/baseline/pjnz/", headers=other, name="B reads A's version")
    b.delete("/baseline/pjnz/", headers=other, name="B deletes from A's version")
    b.post("/session/files/", json={}, headers=other, name="B clears A's files")
    a.get("/baseline/pjnz/", name="A's file is untouched")
    scn.db_rows("version_file")


def test_a_version_that_does_not_exist_is_refused(scn):
    a = login_and_open(scn)
    upload(a, "pjnz", headers={VERSION: "nonexistent"}, name="upload")
    a.get("/baseline/pjnz/", headers={VERSION: "nonexistent"}, name="read")
    for lang in ("fr", "pt"):
        a.get("/baseline/pjnz/", headers={VERSION: "nonexistent", "Accept-Language": lang}, name=f"read in {lang}")
    scn.db_rows("version_file")


def test_endpoints_that_do_not_work_on_a_version_ignore_a_bad_header(scn):
    a = login_and_open(scn)
    bad = {VERSION: "nonexistent"}
    a.get("/projects/", headers=bad, name="projects")
    a.post("/project", json={"name": "new"}, headers=bad, name="create a project")
    a.get("/user/test.user@example.com/exists", headers=bad, name="user exists")


def test_current_project_comes_from_the_header(scn):
    a = login_and_open(scn, project=False)
    v1 = create_project(a, "first").data["versions"][0]["id"]
    create_project(a, "second")
    a.get("/project/current", headers={VERSION: v1}, name="the header names the first project")
    a.get("/project/current", name="the tab's own version is the second project")


def test_current_project_is_null_for_a_version_that_is_not_the_users(scn):
    a = login_and_open(scn, "A", project=False)
    va = create_project(a, "A's project").data["versions"][0]["id"]
    b = login_and_open(scn, "B", user=SUPPORT_USER)
    b.get("/project/current", headers={VERSION: va}, name="another user's version")
    b.get("/project/current", headers={VERSION: "nonexistent"}, name="unknown version")


@pytest.mark.legacy_session
def test_without_the_header_the_version_in_the_session_is_used(scn):
    a = login_and_open(scn, project=False)
    create_project(a, "p")
    a.use_version_header = False
    upload(a, "pjnz", name="no header: the file goes to the session's version")
    a.get("/baseline/pjnz/", name="no header: and is read from it")
    a.get("/project/current", name="no header: current project is the session's")
    scn.db_rows("version_file")


# ------------------------------------------------------------------------------------------------ guest
def test_a_guest_tab_is_given_its_own_version(scn):
    a = scn.client("A")
    a.open_app()
    r = a.start_guest_version(name="the guest tab asks for a version")
    assert r.status == 200
    upload(a, "pjnz")
    a.get("/baseline/pjnz/", name="the guest tab has its file")
    scn.db_rows("project_version")
    scn.db_rows("version_file")


def test_two_guest_tabs_get_two_versions(scn):
    a = guest_open(scn, "A")
    b = second_tab(scn, a)
    b.start_guest_version(name="the second guest tab asks for a version")
    assert a.version_id != b.version_id
    upload(a, "pjnz")
    upload(b, "shape")
    a.get("/baseline/pjnz/", name="tab A has its Spectrum file")
    a.get("/baseline/shape/", name="tab A has no shape file")
    b.get("/baseline/shape/", name="tab B has its shape file")
    b.get("/baseline/pjnz/", name="tab B has no Spectrum file")
    scn.db_rows("version_file")


def test_a_guest_cannot_use_a_version_it_was_not_given(scn):
    a = guest_open(scn, "A")
    b = guest_open(scn, "B")
    upload(b, "pjnz", name="guest B uploads to its own version")
    upload(a, "shape", headers={VERSION: b.version_id}, name="guest A uses guest B's version")
    a.get("/baseline/pjnz/", headers={VERSION: b.version_id}, name="guest A reads guest B's version")
    upload(a, "shape", headers={VERSION: "nonexistent"}, name="guest A uses a version that does not exist")
    scn.db_rows("version_file")


def test_a_guest_cannot_use_the_version_of_a_logged_in_user(scn):
    user = login_and_open(scn, "U", project=False)
    vu = create_project(user, "U's project").data["versions"][0]["id"]
    g = guest_open(scn, "G")
    upload(g, "pjnz", headers={VERSION: vu}, name="guest uses a project's version")
    scn.db_rows("version_file")


def test_a_logged_in_user_cannot_get_a_guest_version(scn):
    a = login_and_open(scn)
    a.post("/guest/version", name="logged in user asks for a guest version")
    a.post("/guest/version", headers={"Accept-Language": "fr"}, name="in french")
