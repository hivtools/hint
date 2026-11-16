"""Uploading, validating and removing the input files of a version, and setting them all at once (app/routers/input_files.py).

What is checked by hintr (whether a file is a good one) is hintr's to say, so hintr here answers what the test tells it to
and the tests look at what it was asked.
"""

import hashlib
import json
from pathlib import Path
from typing import Any

import httpx2
import pytest

from app.db.database import create_db_session_factory
from app.db.version_repository import VersionRepository
from tests.api.helpers import add_files, create_project, hintr_file, known_hashes, make_client, version_files
from tests.hintr import HINTR_FAILURE, SUCCESS, failure
from tests.support import OTHER_USER, USER

BASELINE = ["pjnz", "shape", "population"]
DISEASE = ["survey", "programme", "anc"]
URLS = {**{t: f"/baseline/{t}" for t in BASELINE}, **{t: f"/disease/{t}" for t in DISEASE}}

CONTENT = b"abc"
# The upper case MD5 of "abc"
ABC = "900150983CD24FB0D6963F7D28E17F72"


# A file name that hintr accepts for each type, and the name the file is stored under
GOOD_NAMES = {**dict.fromkeys(URLS, "data.csv"), "pjnz": "data.PJNZ", "shape": "data.geojson"}


def upload_for(file_type: str, content: bytes = CONTENT) -> dict:
    return upload_of(content, GOOD_NAMES[file_type])


def stored_as(file_type: str) -> str:
    return f"{ABC}.{GOOD_NAMES[file_type].rsplit('.', 1)[1]}"


def md5(content: bytes) -> str:
    return hashlib.md5(content, usedforsecurity=False).hexdigest().upper()


def upload_of(content: bytes = CONTENT, filename: str = "data.PJNZ") -> dict:
    return {"files": {"file": (filename, content, "application/octet-stream")}}


def sent_to_hintr(hintr) -> list[tuple[str, str, Any]]:
    """(method, path with its query, body) of each call."""
    return [(c.method, c.url.raw_path.decode(), json.loads(c.content) if c.content else None) for c in hintr.calls]


def uploaded_file(folder: Path, name: str, filename: str = "data.PJNZ") -> dict:
    """What hintr is told about a file that has just been uploaded to the folder under this name."""
    return {"path": f"{folder}/{name}", "hash": name, "filename": filename, "fromADR": False, "resource_url": None}


def files_in(folder: Path) -> list[str]:
    return sorted(p.name for p in folder.iterdir())


# ---- Uploading


@pytest.mark.parametrize("file_type", URLS)
async def test_an_upload_is_stored_attached_to_the_version_and_validated(
    on_a_version, hintr, engine, version_id, uploads_dir, file_type
):
    if file_type in DISEASE:
        await add_files(engine, version_id, "pjnz", "shape")
    r = await on_a_version.post(URLS[file_type], **upload_for(file_type))
    # hintr's answer comes back as it is
    assert r.status_code == 200
    assert r.content == SUCCESS
    assert (uploads_dir / stored_as(file_type)).read_bytes() == CONTENT
    assert await known_hashes(engine) == sorted(
        [stored_as(file_type), *(["pjnz123", "shape123"] if file_type in DISEASE else [])]
    )
    assert (await version_files(engine, version_id))[file_type] == (
        stored_as(file_type),
        GOOD_NAMES[file_type],
        False,
        None,
    )


@pytest.mark.parametrize("file_type", BASELINE)
async def test_a_baseline_file_is_validated_alone(on_a_version, hintr, uploads_dir, file_type):
    await on_a_version.post(URLS[file_type], **upload_for(file_type))
    assert sent_to_hintr(hintr) == [
        (
            "POST",
            "/validate/baseline-individual",
            {"type": file_type, "file": uploaded_file(uploads_dir, stored_as(file_type), GOOD_NAMES[file_type])},
        )
    ]


@pytest.mark.parametrize("file_type", DISEASE)
async def test_a_disease_file_is_validated_against_the_shape_file(
    on_a_version, hintr, engine, version_id, uploads_dir, file_type
):
    await add_files(engine, version_id, "pjnz", "shape")
    await on_a_version.post(URLS[file_type], **upload_for(file_type))
    assert sent_to_hintr(hintr) == [
        (
            "POST",
            "/validate/survey-and-programme",
            {
                "type": file_type,
                "file": uploaded_file(uploads_dir, stored_as(file_type), GOOD_NAMES[file_type]),
                "shape": f"{uploads_dir}/shape123",
            },
        )
    ]


async def test_the_upload_dir_is_where_the_files_are_written_and_where_hintr_is_told_they_are(
    on_a_version, hintr, tmp_path, settings_overrides
):
    folder = tmp_path / "share"
    settings_overrides["upload_dir"] = str(folder)
    await on_a_version.post("/baseline/pjnz", **upload_of())
    assert files_in(folder) == [f"{ABC}.PJNZ"]
    assert sent_to_hintr(hintr)[0][2]["file"]["path"] == f"{folder}/{ABC}.PJNZ"


async def test_an_upload_replaces_the_file_of_that_type_that_the_version_had(
    on_a_version, hintr, engine, version_id, uploads_dir
):
    await on_a_version.post("/baseline/pjnz", **upload_of(b"one", "one.PJNZ"))
    await on_a_version.post("/baseline/pjnz", **upload_of(b"two", "two.PJNZ"))
    assert await version_files(engine, version_id) == {"pjnz": (f"{md5(b'two')}.PJNZ", "two.PJNZ", False, None)}
    # The first file is still there, another version may use it
    assert files_in(uploads_dir) == sorted([f"{md5(b'one')}.PJNZ", f"{md5(b'two')}.PJNZ"])


async def test_the_files_of_other_types_are_left_alone(on_a_version, hintr, engine, version_id, uploads_dir):
    await add_files(engine, version_id, "shape")
    await on_a_version.post("/baseline/pjnz", **upload_of())
    assert sorted(await version_files(engine, version_id)) == ["pjnz", "shape"]


async def test_the_same_content_twice_is_one_file_and_one_row(on_a_version, hintr, engine, version_id, uploads_dir):
    await on_a_version.post("/baseline/pjnz", **upload_of())
    await on_a_version.post("/baseline/pjnz", **upload_of())
    assert files_in(uploads_dir) == [f"{ABC}.PJNZ"]
    assert await known_hashes(engine) == [f"{ABC}.PJNZ"]


async def test_the_same_content_as_two_types_is_one_file_and_two_rows(
    on_a_version, hintr, engine, version_id, uploads_dir
):
    await add_files(engine, version_id, "pjnz", "shape")
    await on_a_version.post("/disease/anc", **upload_of(filename="data.csv"))
    await on_a_version.post("/disease/programme", **upload_of(filename="data.csv"))
    assert files_in(uploads_dir) == [f"{ABC}.csv"]
    files = await version_files(engine, version_id)
    assert files["anc"] == files["programme"] == (f"{ABC}.csv", "data.csv", False, None)


async def test_two_users_uploading_the_same_file_share_it(on_a_version, hintr, engine, uploads_dir):
    async with make_client(OTHER_USER) as someone_else:
        other_version = (await create_project(someone_else))["versions"][0]["id"]
    async with make_client(OTHER_USER, other_version) as someone_else:
        await on_a_version.post("/baseline/pjnz", **upload_of())
        await someone_else.post("/baseline/pjnz", **upload_of())
    assert files_in(uploads_dir) == [f"{ABC}.PJNZ"]
    assert await known_hashes(engine) == [f"{ABC}.PJNZ"]


async def test_a_file_that_is_missing_from_the_disk_is_written_again_by_the_next_upload(
    on_a_version, hintr, engine, uploads_dir
):
    await on_a_version.post("/baseline/pjnz", **upload_of())
    (uploads_dir / f"{ABC}.PJNZ").unlink()
    await on_a_version.post("/baseline/pjnz", **upload_of())
    assert (uploads_dir / f"{ABC}.PJNZ").read_bytes() == CONTENT


@pytest.mark.parametrize(
    ("filename", "name"),
    [
        ("my weird name (1).PJNZ", f"{ABC}.PJNZ"),
        ("lower.pjnz", f"{ABC}.pjnz"),
        ("archive.tar.zip", f"{ABC}.zip"),
        ("UPPER.ZIP", f"{ABC}.ZIP"),
        ("../../escape.zip", f"{ABC}.zip"),
    ],
)
async def test_the_name_of_the_file_is_the_hash_and_the_text_after_the_last_dot_of_what_the_user_called_it(
    on_a_version, hintr, engine, version_id, uploads_dir, filename, name
):
    await on_a_version.post("/baseline/pjnz", **upload_of(CONTENT, filename))
    assert files_in(uploads_dir) == [name]
    # What the user called it is kept as it was, to show them
    assert (await version_files(engine, version_id))["pjnz"] == (name, filename, False, None)
    assert sent_to_hintr(hintr)[0][2]["file"] == uploaded_file(uploads_dir, name, filename)


async def test_a_file_that_hintr_does_not_accept_is_still_the_version_s_file(
    on_a_version, hintr, engine, version_id, uploads_dir
):
    """As in the Kotlin app. The Vue app takes the file off the screen when it uploads another, whatever comes of it, so
    keeping the one that was there would leave the screen and the server saying different things."""
    await on_a_version.post("/baseline/pjnz", **upload_of(b"good", "good.PJNZ"))
    hintr.answer(400, json=HINTR_FAILURE)
    r = await on_a_version.post("/baseline/pjnz", **upload_of(b"bad", "bad.PJNZ"))
    assert r.status_code == 400
    assert r.json() == HINTR_FAILURE
    assert (await version_files(engine, version_id))["pjnz"][1] == "bad.PJNZ"


async def test_a_file_is_the_version_s_even_if_hintr_cannot_be_reached(
    on_a_version, hintr, engine, version_id, uploads_dir
):
    hintr.fail_to_connect(httpx2.ConnectError("down"))
    r = await on_a_version.post("/baseline/pjnz", **upload_of())
    assert r.status_code == 500
    assert r.json() == failure("No response returned. The request may have timed out.")
    assert (await version_files(engine, version_id))["pjnz"][0] == f"{ABC}.PJNZ"


async def test_the_language_of_the_request_goes_to_hintr(on_a_version, hintr, uploads_dir):
    await on_a_version.post("/baseline/pjnz", **upload_of(), headers={"Accept-Language": "fr"})
    assert hintr.calls[0].headers["Accept-Language"] == "fr"


async def test_a_guest_may_upload_to_a_version_the_server_gave_them(api, hintr, engine, uploads_dir):
    async with create_db_session_factory(engine)() as db_session, db_session.begin():
        await VersionRepository(db_session).save_version("g1", None)
    async with make_client("guest", "g1") as guest:
        guest.headers["X-Hint-Guest-Versions"] = "g1"
        r = await guest.post("/baseline/pjnz", **upload_of())
    assert r.status_code == 200
    assert (await version_files(engine, "g1"))["pjnz"][0] == f"{ABC}.PJNZ"


@pytest.mark.parametrize("file_type", URLS)
async def test_nothing_is_written_for_a_version_the_user_may_not_use(
    api, hintr, engine, version_id, uploads_dir, file_type
):
    async with make_client(OTHER_USER, version_id) as someone_else:
        r = await someone_else.post(URLS[file_type], **upload_for(file_type))
    assert r.status_code == 403
    assert r.json()["errors"][0]["error"] == "INVALID_VERSION"
    assert files_in(uploads_dir) == []
    assert await known_hashes(engine) == []
    assert hintr.calls == []


async def test_nothing_is_written_without_a_version(api, hintr, engine, uploads_dir):
    r = await api.post("/baseline/pjnz", **upload_of())
    assert r.status_code == 403
    assert files_in(uploads_dir) == []
    assert hintr.calls == []


# ---- Requests that are not an upload


async def test_a_request_with_no_file_part_is_a_bad_request(on_a_version, hintr, uploads_dir):
    r = await on_a_version.post("/baseline/pjnz", files={"other": ("a.PJNZ", b"abc")})
    assert r.status_code == 400
    assert r.json()["errors"][0]["error"] == "OTHER_ERROR"
    assert hintr.calls == []


async def test_a_request_with_no_body_is_a_bad_request(on_a_version, hintr, uploads_dir):
    r = await on_a_version.post("/baseline/pjnz")
    assert r.status_code == 400
    assert hintr.calls == []


async def test_a_request_with_json_is_a_bad_request(on_a_version, hintr, uploads_dir):
    r = await on_a_version.post("/baseline/pjnz", json={"file": "x"})
    assert r.status_code == 400


async def test_a_file_sent_as_a_form_field_is_an_unsupported_media_type(on_a_version, hintr, uploads_dir):
    r = await on_a_version.post("/baseline/pjnz", data={"file": "text"})
    assert r.status_code == 415


async def test_a_file_with_no_name_is_a_bad_request(on_a_version, hintr, engine, version_id, uploads_dir):
    r = await on_a_version.post("/baseline/pjnz", **upload_of(CONTENT, ""))
    assert r.status_code == 400
    assert files_in(uploads_dir) == []
    assert await version_files(engine, version_id) == {}
    assert hintr.calls == []


async def test_vmmc_is_not_served(on_a_version, hintr, uploads_dir):
    for method in ("POST", "GET", "DELETE"):
        r = await on_a_version.request(method, "/disease/vmmc")
        assert r.status_code in (404, 405)
    assert hintr.calls == []


# ---- Survey, programme and ANC need the files they are checked against


@pytest.mark.parametrize("file_type", DISEASE)
async def test_without_a_shape_file_an_upload_is_refused_but_kept(
    on_a_version, hintr, engine, version_id, uploads_dir, file_type
):
    r = await on_a_version.post(URLS[file_type], **upload_for(file_type))
    assert r.status_code == 400
    assert r.json() == failure("You must upload a shape file before uploading survey or programme data.")
    assert hintr.calls == []
    # As in the Kotlin app: the file is the version's even so, so it is there when the shape file is
    assert (await version_files(engine, version_id))[file_type][0] == stored_as(file_type)


@pytest.mark.parametrize("file_type", DISEASE)
async def test_without_a_pjnz_file_an_upload_is_validated(
    on_a_version, hintr, engine, version_id, uploads_dir, file_type
):
    """Kotlin refused it (`missingPjnzFile`) unless `strict=false`. The API needs only the shape file (D10)."""
    await add_files(engine, version_id, "shape")
    r = await on_a_version.post(URLS[file_type], **upload_for(file_type))
    assert r.status_code == 200
    assert [c[1] for c in sent_to_hintr(hintr)] == ["/validate/survey-and-programme"]


async def test_the_strict_query_parameter_is_ignored(on_a_version, hintr, engine, version_id, uploads_dir):
    """Kotlin read `strict`, and the Vue app always sent `true`. The API has no such parameter."""
    await add_files(engine, version_id, "shape")
    for strict in ("true", "false", "bogus"):
        r = await on_a_version.post("/disease/anc", **upload_of(filename="data.csv"), params={"strict": strict})
        assert r.status_code == 200
    assert [c[1] for c in sent_to_hintr(hintr)] == ["/validate/survey-and-programme"] * 3


async def test_the_message_is_in_the_language_of_the_request(on_a_version, hintr, uploads_dir):
    r = await on_a_version.post("/disease/anc", **upload_of(filename="data.csv"), headers={"Accept-Language": "fr"})
    assert r.status_code == 400
    assert r.json()["errors"][0]["detail"].startswith("Vous devez")


async def test_the_baseline_does_not_need_other_files(on_a_version, hintr, uploads_dir):
    for file_type in BASELINE:
        r = await on_a_version.post(URLS[file_type], **upload_for(file_type))
        assert r.status_code == 200


# ---- Getting the file again


@pytest.mark.parametrize("file_type", URLS)
async def test_there_is_nothing_to_get_before_an_upload(on_a_version, hintr, file_type):
    r = await on_a_version.get(URLS[file_type])
    assert r.status_code == 200
    assert r.json() == {"data": None, "errors": [], "status": "success"}
    assert hintr.calls == []


@pytest.mark.parametrize("file_type", BASELINE)
async def test_a_baseline_file_is_validated_again_when_it_is_got(on_a_version, hintr, engine, version_id, file_type):
    await add_files(engine, version_id, file_type)
    r = await on_a_version.get(URLS[file_type])
    assert r.status_code == 200
    assert r.content == SUCCESS
    assert sent_to_hintr(hintr) == [
        ("POST", "/validate/baseline-individual", {"type": file_type, "file": hintr_file(file_type)})
    ]


@pytest.mark.parametrize("file_type", DISEASE)
async def test_a_disease_file_is_validated_again_when_it_is_got(on_a_version, hintr, engine, version_id, file_type):
    await add_files(engine, version_id, "pjnz", "shape", file_type)
    await on_a_version.get(URLS[file_type])
    assert sent_to_hintr(hintr) == [
        (
            "POST",
            "/validate/survey-and-programme",
            {"type": file_type, "file": hintr_file(file_type), "shape": "/uploads/shape123"},
        )
    ]


async def test_a_file_that_was_removed_is_not_got(on_a_version, hintr, engine, version_id):
    await add_files(engine, version_id, "pjnz", "shape", "anc")
    await on_a_version.post("/session/files", json={})
    assert (await on_a_version.get("/disease/anc")).json() == {"data": None, "errors": [], "status": "success"}


async def test_getting_a_disease_file_without_the_pjnz_is_validated_again(on_a_version, hintr, engine, version_id):
    await add_files(engine, version_id, "anc", "shape")
    r = await on_a_version.get("/disease/anc")
    assert r.status_code == 200
    assert [c[1] for c in sent_to_hintr(hintr)] == ["/validate/survey-and-programme"]


async def test_getting_a_disease_file_without_the_shape_is_refused_as_it_is_for_an_upload(
    on_a_version, hintr, engine, version_id
):
    await add_files(engine, version_id, "anc")
    r = await on_a_version.get("/disease/anc")
    assert r.status_code == 400
    assert r.json() == failure("You must upload a shape file before uploading survey or programme data.")
    assert hintr.calls == []


async def test_a_failure_of_hintr_comes_back_when_a_file_is_got(on_a_version, hintr, engine, version_id):
    await add_files(engine, version_id, "pjnz")
    hintr.answer(400, json=HINTR_FAILURE)
    r = await on_a_version.get("/baseline/pjnz")
    assert r.status_code == 400
    assert r.json() == HINTR_FAILURE


async def test_the_file_got_is_the_one_of_the_version_in_the_request(on_a_version, hintr, engine, version_id, api):
    await add_files(engine, version_id, "pjnz")
    other = (await create_project(api))["versions"][0]["id"]
    async with make_client(USER, other) as on_another:
        r = await on_another.get("/baseline/pjnz")
    assert r.json()["data"] is None
    assert hintr.calls == []


# ---- Removing the file


@pytest.mark.parametrize("file_type", URLS)
async def test_a_file_is_removed_from_the_version_but_not_from_the_disk(
    on_a_version, hintr, engine, version_id, uploads_dir, file_type
):
    await add_files(engine, version_id, "pjnz", "shape", "population", "survey", "programme", "anc")
    r = await on_a_version.delete(URLS[file_type])
    assert r.status_code == 200
    assert r.json() == {"data": True, "errors": [], "status": "success"}
    assert sorted(await version_files(engine, version_id)) == sorted(set(URLS) - {file_type})
    assert hintr.calls == []


async def test_a_file_that_was_uploaded_is_kept_on_the_disk_when_it_is_removed(
    on_a_version, hintr, engine, version_id, uploads_dir
):
    await on_a_version.post("/baseline/pjnz", **upload_of())
    await on_a_version.delete("/baseline/pjnz")
    assert files_in(uploads_dir) == [f"{ABC}.PJNZ"]
    assert await known_hashes(engine) == [f"{ABC}.PJNZ"]
    assert (await on_a_version.get("/baseline/pjnz")).json()["data"] is None


async def test_removing_a_file_that_is_not_there_is_a_success(on_a_version):
    for _ in range(2):
        r = await on_a_version.delete("/baseline/pjnz")
        assert r.status_code == 200
        assert r.json()["data"] is True


async def test_a_file_is_not_removed_from_a_version_the_user_may_not_use(api, engine, version_id):
    await add_files(engine, version_id, "pjnz")
    async with make_client(OTHER_USER, version_id) as someone_else:
        r = await someone_else.delete("/baseline/pjnz")
    assert r.status_code == 403
    assert list(await version_files(engine, version_id)) == ["pjnz"]


async def test_a_file_is_not_got_by_a_user_who_may_not_use_the_version(api, hintr, engine, version_id):
    await add_files(engine, version_id, "pjnz")
    async with make_client(OTHER_USER, version_id) as someone_else:
        r = await someone_else.get("/baseline/pjnz")
    assert r.status_code == 403
    assert hintr.calls == []


# ---- The baseline files together


async def test_the_baseline_is_validated_with_the_paths_of_its_files_and_null_for_the_others(
    on_a_version, hintr, engine, version_id
):
    r = await on_a_version.get("/baseline/validate")
    assert r.status_code == 200
    assert r.content == SUCCESS
    await add_files(engine, version_id, "pjnz", "population", "survey")
    await on_a_version.get("/baseline/validate")
    assert sent_to_hintr(hintr) == [
        ("POST", "/validate/baseline-combined", {"pjnz": None, "shape": None, "population": None}),
        (
            "POST",
            "/validate/baseline-combined",
            {"pjnz": "/uploads/pjnz123", "shape": None, "population": "/uploads/population123"},
        ),
    ]


async def test_a_failure_of_hintr_comes_back_when_the_baseline_is_validated(on_a_version, hintr):
    hintr.answer(400, json=HINTR_FAILURE)
    r = await on_a_version.get("/baseline/validate")
    assert r.status_code == 400
    assert r.json() == HINTR_FAILURE


async def test_the_baseline_is_not_validated_for_a_version_the_user_may_not_use(api, hintr, version_id):
    async with make_client(OTHER_USER, version_id) as someone_else:
        r = await someone_else.get("/baseline/validate")
    assert r.status_code == 403
    assert hintr.calls == []


# ---- Setting all the files


def entry(file_hash: str, filename: str = "f.csv", from_adr: bool = False, resource_url: str | None = None) -> dict:
    body = {"hash": file_hash, "filename": filename, "fromAdr": from_adr}
    if resource_url is not None:
        body["resource_url"] = resource_url
    return body


async def test_the_files_are_replaced_by_the_ones_that_are_sent(on_a_version, engine, version_id):
    await add_files(engine, version_id, "pjnz", "shape")
    r = await on_a_version.post("/session/files", json={"pjnz": entry("pjnz123", "pjnz.pjnz")})
    assert r.status_code == 200
    assert await version_files(engine, version_id) == {"pjnz": ("pjnz123", "pjnz.pjnz", False, None)}


async def test_what_is_sent_comes_back_with_the_resource_url_null_if_there_was_none(on_a_version, engine, version_id):
    await add_files(engine, version_id, "pjnz", "shape")
    r = await on_a_version.post("/session/files", json={"pjnz": None, "shape": entry("shape123", "shape.shape")})
    assert r.json() == {
        "data": {
            "pjnz": None,
            "shape": {"hash": "shape123", "filename": "shape.shape", "fromAdr": False, "resource_url": None},
        },
        "errors": [],
        "status": "success",
    }
    # A null is no file, so the version has none of that type
    assert list(await version_files(engine, version_id)) == ["shape"]


async def test_a_file_from_adr_keeps_its_url(on_a_version, engine, version_id):
    await add_files(engine, version_id, "pjnz")
    r = await on_a_version.post("/session/files", json={"pjnz": entry("pjnz123", "renamed.PJNZ", True, "http://x/y")})
    assert r.json()["data"]["pjnz"] == {
        "hash": "pjnz123",
        "filename": "renamed.PJNZ",
        "fromAdr": True,
        "resource_url": "http://x/y",
    }
    assert (await version_files(engine, version_id))["pjnz"] == ("pjnz123", "renamed.PJNZ", True, "http://x/y")


async def test_an_empty_map_removes_all_the_files(on_a_version, engine, version_id):
    await add_files(engine, version_id, "pjnz", "shape")
    r = await on_a_version.post("/session/files", json={})
    assert r.status_code == 200
    assert r.json() == {"data": {}, "errors": [], "status": "success"}
    assert await version_files(engine, version_id) == {}


@pytest.mark.parametrize("file_type", ["anc", "pjnz", "population", "programme", "shape", "survey", "vmmc"])
async def test_every_type_a_version_may_have_is_accepted_including_the_vmmc_of_old_projects(
    on_a_version, engine, version_id, file_type
):
    await add_files(engine, version_id, file_type)
    r = await on_a_version.post("/session/files", json={file_type: entry(f"{file_type}123")})
    assert r.status_code == 200
    assert list(await version_files(engine, version_id)) == [file_type]


async def test_a_hash_that_was_never_uploaded_is_refused_and_nothing_changes(on_a_version, engine, version_id):
    await add_files(engine, version_id, "pjnz", "shape")
    r = await on_a_version.post("/session/files", json={"shape": entry("shape123"), "pjnz": entry("badhash")})
    assert r.status_code == 400
    assert r.json() == failure("Unable to load files for session. Specified files do not exist on the server.")
    assert sorted(await version_files(engine, version_id)) == ["pjnz", "shape"]
    assert (await version_files(engine, version_id))["pjnz"][0] == "pjnz123"


async def test_the_message_for_a_hash_that_was_never_uploaded_is_in_the_language_of_the_request(on_a_version):
    r = await on_a_version.post("/session/files", json={"pjnz": entry("badhash")}, headers={"Accept-Language": "fr"})
    assert r.status_code == 400
    assert r.json()["errors"][0]["detail"].startswith("Impossible de charger")


async def test_any_file_that_has_been_uploaded_may_be_used_whoever_uploaded_it(on_a_version, engine, api):
    """As in the Kotlin app, which has no record of who uploaded what (see QUIRKS.md). Loading a project that was made
    from the output of someone else's model needs this."""
    other = (await create_project(api))["versions"][0]["id"]
    await add_files(engine, other, "pjnz")
    r = await on_a_version.post("/session/files", json={"pjnz": entry("pjnz123")})
    assert r.status_code == 200


async def test_a_type_that_does_not_exist_is_a_bad_request_and_nothing_changes(on_a_version, engine, version_id):
    await add_files(engine, version_id, "pjnz")
    r = await on_a_version.post("/session/files", json={"bogus": entry("pjnz123"), "pjnz": entry("pjnz123")})
    assert r.status_code == 400
    assert list(await version_files(engine, version_id)) == ["pjnz"]


@pytest.mark.parametrize(
    "body",
    [[1, 2], {"pjnz": {"filename": "x"}}, {"pjnz": "abc"}, {"pjnz": entry("pjnz123"), "shape": 1}],
    ids=["array", "no hash", "a string", "another entry that is not a file"],
)
async def test_a_body_that_is_not_files_is_a_bad_request(on_a_version, engine, version_id, body):
    await add_files(engine, version_id, "pjnz")
    r = await on_a_version.post("/session/files", json=body)
    assert r.status_code == 400
    assert list(await version_files(engine, version_id)) == ["pjnz"]


async def test_no_body_and_a_body_that_is_not_json_are_bad_requests(on_a_version):
    assert (await on_a_version.post("/session/files")).status_code == 400
    r = await on_a_version.post("/session/files", content=b"{not json", headers={"Content-Type": "application/json"})
    assert r.status_code == 400
    assert (await on_a_version.post("/session/files", data={"pjnz": "x"})).status_code == 415


async def test_the_files_are_not_set_for_a_version_the_user_may_not_use(api, engine, version_id):
    await add_files(engine, version_id, "pjnz")
    async with make_client(OTHER_USER, version_id) as someone_else:
        r = await someone_else.post("/session/files", json={})
    assert r.status_code == 403
    assert list(await version_files(engine, version_id)) == ["pjnz"]
