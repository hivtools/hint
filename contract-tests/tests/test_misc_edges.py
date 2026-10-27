"""Small edge cases that do not belong to one endpoint group: language negotiation, HEAD/OPTIONS, odd names."""
from __future__ import annotations

import pytest

from hintcontract.flows import create_project, guest_open, login_and_open, upload
from hintcontract.scenario import Upload


@pytest.mark.parametrize("header", ["FR", "fr_FR", "pt-BR", "pt", "en-GB", "de", "*", "", "fr;q=0.5", "xx-invalid"],
                         ids=["upper", "underscore", "pt-BR", "pt", "en-GB", "de", "star", "empty", "q-value", "garbage"])
def test_accept_language_variants_for_hint_errors(scn, header):
    """hint looks up its own translation bundle by the raw header value (language only, no q-value parsing)."""
    a = login_and_open(scn)
    a.get("/project/999/version/nope", headers={"Accept-Language": header}, name="versionDoesNotExist")
    a.post("/project/999/rename", json={"name": "x"}, headers={"Accept-Language": header}, name="projectDoesNotExist")


def test_head_and_options_requests(scn):
    a = scn.client("A")
    a.request("HEAD", "/sso", name="HEAD /sso")
    a.request("OPTIONS", "/sso", name="OPTIONS /sso")
    a.request("OPTIONS", "/project", name="OPTIONS /project (secured prefix)")
    a.request("HEAD", "/", name="HEAD /")
    a.request("PATCH", "/sso", name="PATCH /sso")


def test_project_names_and_notes_with_unusual_content(scn):
    a = login_and_open(scn, project=False)
    long_name = "n" * 1000
    create_project(a, "Caf\u00e9 \u2603 \u4e2d\u6587", "line1\nline2 <b>html</b> 'quote' \"dq\"", name_="unicode, markup")
    create_project(a, long_name, "x" * 5000, name_="very long name and note")
    a.post("/project", json={"name": "  padded  "}, name="whitespace is kept")
    a.get("/projects/", name="all round trip unchanged")
    scn.db_rows("project")


def test_projects_are_listed_most_recently_updated_first(scn):
    a = login_and_open(scn, project=False)
    p1 = create_project(a, "first").data
    p2 = create_project(a, "second").data
    p3 = create_project(a, "third").data
    a.get("/projects/", name="newest created first")
    a.post(f"/project/{p1['id']}/version/{p1['versions'][0]['id']}/note", json={"note": "touch"}, name="touch first project")
    a.get("/projects/", name="touched project moves to the top")
    a.post(f"/project/{p1['id']}/note", json={"note": "project note only"}, name="project note does not touch versions")
    a.get("/projects/", name="project note change does not reorder")


def test_filename_with_path_components(scn):
    a = login_and_open(scn)
    data = (scn.env.fixtures_dir / "Malawi2024.PJNZ").read_bytes()
    a.post("/baseline/pjnz/", files={"file": Upload("C:\\Users\\me\\Malawi2024.PJNZ", data)}, name="windows path as filename")
    a.post("/baseline/pjnz/", files={"file": Upload("some/dir/Malawi2024.PJNZ", data)}, name="unix path as filename")
    scn.db_rows("version_file")
    scn.uploads()


def test_multipart_part_content_type_and_extra_parts_are_ignored(scn):
    a = login_and_open(scn)
    data = (scn.env.fixtures_dir / "Malawi2024.PJNZ").read_bytes()
    a.post("/baseline/pjnz/", files={"file": Upload("a.PJNZ", data, "text/plain")}, form={"extra": "ignored"},
           name="declared text/plain plus an extra form field")


def test_many_versions_numbering(scn):
    a = login_and_open(scn, project=False)
    p = create_project(a, "p").data
    v = p["versions"][0]["id"]
    for i in range(12):
        a.post(f"/project/{p['id']}/version", json={"parent": v}, name=f"version {i + 2}")
    r = a.get("/projects/", name="twelve versions newest first")
    assert len(r.data[0]["versions"]) == 13


def test_user_exists_special_characters(scn):
    a = login_and_open(scn)
    a.get("/user/test.user%40example.com/exists", name="percent-encoded @")
    a.get("/user/a%20b@example.com/exists", name="space in local part")
    a.get("/user/test.user@example.com%0A/exists", name="trailing newline")
    a.get("/user/%2e%2e/exists", name="dots")
