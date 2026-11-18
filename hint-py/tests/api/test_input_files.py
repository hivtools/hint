"""Tests of the endpoints that upload, validate and remove the input files of a version, and set all the files
(app/routers/input_files.py, and through it app/services/input_file_service.py).

Only hintr can validate the content of a file. So in these tests hintr gives the answer that the test sets, and the
tests check what the API asked hintr.
"""

import hashlib
import json
from pathlib import Path
from typing import Any

import httpx2
import pytest

from app.config import Settings
from app.db.database import create_db_session_factory
from app.db.version_repository import VersionRepository
from tests.api.helpers import add_files, create_project, hintr_file, known_hashes, make_client, version_files
from tests.hintr import HINTR_FAILURE, SUCCESS, failure
from tests.support import OTHER_USER, USER

BASELINE = ["pjnz", "shape", "population"]
DISEASE = ["survey", "programme", "anc"]
URLS = {**{t: f"/baseline/{t}" for t in BASELINE}, **{t: f"/disease/{t}" for t in DISEASE}}

# The setting that has the size limit of each kind of file
LIMIT_SETTINGS = {t: f"max_{t}_upload_bytes" for t in URLS}

CONTENT = b"abc"
# The upper case MD5 of "abc"
ABC = "900150983CD24FB0D6963F7D28E17F72"


# A file name that hintr accepts for each file type
GOOD_NAMES = {**dict.fromkeys(URLS, "data.csv"), "pjnz": "data.PJNZ", "shape": "data.geojson"}


def upload_for(file_type: str, content: bytes = CONTENT) -> dict:
    return upload_of(content, GOOD_NAMES[file_type])


def stored_as(file_type: str) -> str:
    return f"{ABC}.{GOOD_NAMES[file_type].rsplit('.', 1)[1]}"


def set_limits(settings: Settings, limit: int) -> None:
    """The same size limit for every kind of file."""
    for setting in LIMIT_SETTINGS.values():
        setattr(settings, setting, limit)


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
    # The API returns the answer of hintr without a change
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
    on_a_version, hintr, tmp_path, settings
):
    folder = tmp_path / "share"
    settings.upload_dir = str(folder)
    await on_a_version.post("/baseline/pjnz", **upload_of())
    assert files_in(folder) == [f"{ABC}.PJNZ"]
    assert sent_to_hintr(hintr)[0][2]["file"]["path"] == f"{folder}/{ABC}.PJNZ"


# ---- The extension of the file

WRONG = [
    ("pjnz", "data.geojson", "PJNZ, zip", "geojson"),
    ("pjnz", "data.csv", "PJNZ, zip", "csv"),
    ("shape", "data.shp", "geojson", "shp"),
    ("shape", "data.json", "geojson", "json"),
    ("population", "data.xlsx", "csv", "xlsx"),
    ("survey", "data.zip", "csv", "zip"),
    ("programme", "data.geojson", "csv", "geojson"),
    ("anc", "data.PJNZ", "csv", "PJNZ"),
    ("pjnz", "README", "PJNZ, zip", "README"),
    ("pjnz", "trailing.", "PJNZ, zip", ""),
    ("pjnz", "data.csv_copy", "PJNZ, zip", ""),
]


@pytest.mark.parametrize(("file_type", "filename", "expected", "got"), WRONG)
async def test_a_file_of_another_kind_is_refused_and_nothing_is_kept(
    on_a_version, hintr, engine, version_id, uploads_dir, file_type, filename, expected, got
):
    await add_files(engine, version_id, "pjnz", "shape", "population", "survey", "programme", "anc")
    before = await known_hashes(engine)
    r = await on_a_version.post(URLS[file_type], **upload_of(CONTENT, filename))
    assert r.status_code == 400
    assert r.json() == {
        "data": {},
        "errors": [{"error": "INVALID_FILE_EXTENSION", "detail": f"File must be of type {expected}, got type {got}."}],
        "status": "failure",
    }
    # Not written, hintr is not asked, and no new hash is known
    assert files_in(uploads_dir) == []
    assert hintr.calls == []
    assert await known_hashes(engine) == before
    # The file of that type that the version had is taken off, as the Vue app has taken it off the screen. Others stay
    files = await version_files(engine, version_id)
    assert file_type not in files
    assert len(files) == 5


@pytest.mark.parametrize("language", ["fr", "pt"])
async def test_the_refusal_is_in_the_language_of_the_request(on_a_version, hintr, language):
    r = await on_a_version.post(
        "/baseline/shape", headers={"Accept-Language": language}, **upload_of(CONTENT, "data.shp")
    )
    detail = r.json()["errors"][0]["detail"]
    assert (
        detail
        == {
            "fr": "Le fichier doit être de type geojson, mais il est du type shp.",
            "pt": "O ficheiro tem de ser do tipo geojson, foi obtido o tipo shp.",
        }[language]
    )


@pytest.mark.parametrize(
    ("file_type", "filename"),
    [
        ("pjnz", "data.PJNZ"),
        ("pjnz", "data.pjnz"),
        ("pjnz", "data.ZIP"),
        ("shape", "data.GeoJSON"),
        ("survey", "data.CSV"),
        ("anc", "my file.csv"),
    ],
)
async def test_the_extension_is_checked_without_regard_to_case(
    on_a_version, hintr, engine, version_id, uploads_dir, file_type, filename
):
    if file_type in DISEASE:
        await add_files(engine, version_id, "pjnz", "shape")
    r = await on_a_version.post(URLS[file_type], **upload_of(CONTENT, filename))
    assert r.status_code == 200
    assert len(files_in(uploads_dir)) == 1


async def test_a_refused_file_is_taken_off_even_if_the_version_had_none_and_it_is_the_only_effect(
    on_a_version, engine, version_id, uploads_dir
):
    r = await on_a_version.post("/baseline/pjnz", **upload_of(CONTENT, "data.csv"))
    assert r.status_code == 400
    assert await version_files(engine, version_id) == {}


async def test_a_refused_file_is_not_looked_at_for_the_shape_file(on_a_version, hintr):
    """The extension comes first, as in hintr (the shape file is only looked for once the file is known to be one of its
    type), so a csv for the PJNZ is refused as the wrong type and not as a missing shape file."""
    r = await on_a_version.post("/disease/survey", **upload_of(CONTENT, "data.xlsx"))
    assert "File must be of type csv" in r.json()["errors"][0]["detail"]


# ---- The size limit


def multipart(content: bytes) -> tuple[bytes, str]:
    boundary = "testboundary"
    body = (
        (
            f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="data.csv"\r\n'
            f"Content-Type: text/csv\r\n\r\n"
        ).encode()
        + content
        + f"\r\n--{boundary}--\r\n".encode()
    )
    return body, f"multipart/form-data; boundary={boundary}"


@pytest.mark.parametrize("file_type", BASELINE + DISEASE)
async def test_a_file_over_the_limit_is_refused_and_nothing_is_kept(
    on_a_version, hintr, engine, version_id, uploads_dir, settings, file_type
):
    set_limits(settings, 1000)
    response = await on_a_version.post(URLS[file_type], **upload_of(b"x" * 2000))
    assert response.status_code == 413
    assert response.json() == {
        "data": {},
        "errors": [{"error": "FILE_TOO_LARGE", "detail": "The file is too large. Files can be up to 0 MB."}],
        "status": "failure",
    }
    assert files_in(uploads_dir) == []
    assert await version_files(engine, version_id) == {}
    assert await known_hashes(engine) == []
    assert hintr.calls == []


@pytest.mark.parametrize(
    ("file_type", "setting"),
    [
        ("pjnz", "max_pjnz_upload_bytes"),
        ("shape", "max_shape_upload_bytes"),
        ("population", "max_population_upload_bytes"),
        ("survey", "max_survey_upload_bytes"),
        ("programme", "max_programme_upload_bytes"),
        ("anc", "max_anc_upload_bytes"),
    ],
)
async def test_each_kind_of_file_has_its_own_limit(
    on_a_version, hintr, engine, version_id, uploads_dir, settings, file_type, setting
):
    """Only the limit of the kind of file counts: this one is small, the others are as big as the file."""
    set_limits(settings, 10_000)
    setattr(settings, setting, 1000)
    await add_files(engine, version_id, "pjnz", "shape")
    assert (await on_a_version.post(URLS[file_type], **upload_for(file_type, b"x" * 2000))).status_code == 413
    others = [t for t in URLS if LIMIT_SETTINGS[t] != setting]
    assert others
    for other in others:
        assert (await on_a_version.post(URLS[other], **upload_for(other, b"x" * 2000))).status_code == 200


async def test_a_file_within_the_limit_is_accepted(on_a_version, hintr, uploads_dir, settings):
    set_limits(settings, 1000)
    response = await on_a_version.post("/baseline/pjnz", **upload_of(b"x" * 500))
    assert response.status_code == 200


async def test_a_request_that_does_not_say_how_big_it_is_is_stopped_at_the_limit(
    on_a_version, hintr, engine, version_id, uploads_dir, settings
):
    set_limits(settings, 1000)
    body, content_type = multipart(b"x" * 5000)

    async def in_chunks():
        for start in range(0, len(body), 300):
            yield body[start : start + 300]

    # A generator has no length, so it is sent in chunks and there is no Content-Length to go by
    response = await on_a_version.post("/baseline/pjnz", content=in_chunks(), headers={"content-type": content_type})
    assert response.status_code == 413
    assert response.json()["errors"][0]["error"] == "FILE_TOO_LARGE"
    assert files_in(uploads_dir) == []
    assert await version_files(engine, version_id) == {}


async def test_a_request_that_says_less_than_it_sends_is_stopped_at_the_limit(
    on_a_version, hintr, uploads_dir, settings
):
    set_limits(settings, 1000)
    body, content_type = multipart(b"x" * 5000)
    headers = {"content-type": content_type, "content-length": "500"}
    response = await on_a_version.post("/baseline/pjnz", content=body, headers=headers)
    assert response.status_code == 413
    assert files_in(uploads_dir) == []


async def test_the_limit_is_said_in_the_language_of_the_request(on_a_version, hintr, settings):
    set_limits(settings, 3 * 1024 * 1024)
    big = upload_of(b"x" * (4 * 1024 * 1024))
    english = await on_a_version.post("/baseline/pjnz", **big)
    french = await on_a_version.post("/baseline/pjnz", headers={"Accept-Language": "fr"}, **big)
    assert english.json()["errors"][0]["detail"] == "The file is too large. Files can be up to 3 MB."
    assert (
        french.json()["errors"][0]["detail"]
        == "Le fichier est trop volumineux. Les fichiers peuvent faire jusqu'à 3 MB."
    )


async def test_the_limit_is_on_the_uploads_and_not_on_other_requests(on_a_version, settings):
    set_limits(settings, 10)
    response = await on_a_version.post("/session/files", json={"pjnz": None})
    assert response.status_code == 200


async def test_an_upload_replaces_the_file_of_that_type_that_the_version_had(
    on_a_version, hintr, engine, version_id, uploads_dir
):
    await on_a_version.post("/baseline/pjnz", **upload_of(b"one", "one.PJNZ"))
    await on_a_version.post("/baseline/pjnz", **upload_of(b"two", "two.PJNZ"))
    assert await version_files(engine, version_id) == {"pjnz": (f"{md5(b'two')}.PJNZ", "two.PJNZ", False, None)}
    # The first file is still there, because another version can use it
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


async def test_two_users_uploading_the_same_file_share_it(app, on_a_version, hintr, engine, uploads_dir):
    async with make_client(app, OTHER_USER) as someone_else:
        other_version = (await create_project(someone_else))["versions"][0]["id"]
    async with make_client(app, OTHER_USER, other_version) as someone_else:
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
    # The version keeps the file name that the user gave, to show to the user
    assert (await version_files(engine, version_id))["pjnz"] == (name, filename, False, None)
    assert sent_to_hintr(hintr)[0][2]["file"] == uploaded_file(uploads_dir, name, filename)


async def test_a_file_that_hintr_does_not_accept_is_still_the_version_s_file(
    on_a_version, hintr, engine, version_id, uploads_dir
):
    """As in the Kotlin app. The Vue app removes the old file from the screen when the user uploads another file, even if
    the upload fails. If the server kept the old file, the screen and the server would show different files."""
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


async def test_a_guest_may_upload_to_a_version_the_server_gave_them(app, hintr, engine, uploads_dir):
    async with create_db_session_factory(engine)() as db_session, db_session.begin():
        await VersionRepository(db_session).save_version("g1", None)
    async with make_client(app, "guest", "g1") as guest:
        guest.headers["X-Hint-Guest-Versions"] = "g1"
        r = await guest.post("/baseline/pjnz", **upload_of())
    assert r.status_code == 200
    assert (await version_files(engine, "g1"))["pjnz"][0] == f"{ABC}.PJNZ"


@pytest.mark.parametrize("file_type", URLS)
async def test_nothing_is_written_for_a_version_the_user_may_not_use(
    app, hintr, engine, version_id, uploads_dir, file_type
):
    async with make_client(app, OTHER_USER, version_id) as someone_else:
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


async def test_a_file_with_an_empty_name_is_a_bad_request(on_a_version, hintr, engine, version_id, uploads_dir, caplog):
    # The test client leaves the name out of the request when it is empty, and then the part is a text field and not a
    # file. So write the multipart body by hand, with `filename=""` and some content.
    body = b'--b\r\nContent-Disposition: form-data; name="file"; filename=""\r\n\r\nabc\r\n--b--\r\n'
    r = await on_a_version.post(
        "/baseline/pjnz", content=body, headers={"Content-Type": "multipart/form-data; boundary=b"}
    )
    assert r.status_code == 400
    # The user is shown a code, and the reason is in the log (as for the other `BadRequestError`s)
    assert [record.reason for record in caplog.records if hasattr(record, "reason")] == [
        "The uploaded file has no name"
    ]
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
    # As in the Kotlin app: the version keeps the file. The file is there when the user uploads the shape file.
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


async def test_the_file_got_is_the_one_of_the_version_in_the_request(app, on_a_version, hintr, engine, version_id, api):
    await add_files(engine, version_id, "pjnz")
    other = (await create_project(api))["versions"][0]["id"]
    async with make_client(app, USER, other) as on_another:
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


async def test_a_file_is_not_removed_from_a_version_the_user_may_not_use(app, engine, version_id):
    await add_files(engine, version_id, "pjnz")
    async with make_client(app, OTHER_USER, version_id) as someone_else:
        r = await someone_else.delete("/baseline/pjnz")
    assert r.status_code == 403
    assert list(await version_files(engine, version_id)) == ["pjnz"]


async def test_a_file_is_not_got_by_a_user_who_may_not_use_the_version(app, hintr, engine, version_id):
    await add_files(engine, version_id, "pjnz")
    async with make_client(app, OTHER_USER, version_id) as someone_else:
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


async def test_the_baseline_is_not_validated_for_a_version_the_user_may_not_use(app, hintr, version_id):
    async with make_client(app, OTHER_USER, version_id) as someone_else:
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
    # A null means no file, so the version has no file of that file type
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


@pytest.mark.parametrize("file_type", ["anc", "pjnz", "population", "programme", "shape", "survey"])
async def test_every_type_a_version_may_have_is_accepted(on_a_version, engine, version_id, file_type):
    await add_files(engine, version_id, file_type)
    r = await on_a_version.post("/session/files", json={file_type: entry(f"{file_type}123")})
    assert r.status_code == 200
    assert list(await version_files(engine, version_id)) == [file_type]


async def test_the_vmmc_file_of_an_old_project_is_ignored(on_a_version, engine, version_id):
    await add_files(engine, version_id, "pjnz", "vmmc")
    r = await on_a_version.post("/session/files", json={"pjnz": entry("pjnz123"), "vmmc": entry("vmmc123")})
    assert r.status_code == 200
    assert list(r.json()["data"]) == ["pjnz"]
    assert list(await version_files(engine, version_id)) == ["pjnz"]


async def test_the_hash_of_the_vmmc_file_of_an_old_project_is_not_checked(on_a_version, engine, version_id):
    await add_files(engine, version_id, "pjnz")
    r = await on_a_version.post("/session/files", json={"pjnz": entry("pjnz123"), "vmmc": entry("badhash")})
    assert r.status_code == 200
    assert list(await version_files(engine, version_id)) == ["pjnz"]


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
    """As in the Kotlin app, which does not record who uploaded each file (see QUIRKS.md). A user can load a project that
    was made from the output of the model of another user. This needs the same rule."""
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


async def test_the_files_are_not_set_for_a_version_the_user_may_not_use(app, engine, version_id):
    await add_files(engine, version_id, "pjnz")
    async with make_client(app, OTHER_USER, version_id) as someone_else:
        r = await someone_else.post("/session/files", json={})
    assert r.status_code == 403
    assert list(await version_files(engine, version_id)) == ["pjnz"]
