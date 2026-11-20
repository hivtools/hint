"""The endpoints that load a project from an output zip (`POST /rehydrate/zip` and `POST /rehydrate/adr`, in
app/routers/rehydrate.py, and through them app/services/rehydrate_service.py).

The zip is the same from an upload and from ADR, so the rules (what is read, what is checked) are tested with the upload,
and the tests of ADR check where the zip comes from: whose credential, what ADR can answer, and the size limit.

hintr is the fake hintr of tests/hintr.py. It knows the tasks that a test names. ADR is the fake ADR of tests/adr.py.
"""

import json
import logging
import os
import zipfile
from collections.abc import AsyncIterator, Callable
from pathlib import Path

import httpx2
import pytest
import pytest_asyncio

from app.main import UPLOAD_LIMITS, app
from app.services.rehydrate_service import MAX_OUTPUT_ZIP_BYTES, UPLOAD_PATH
from tests.adr import STORAGE, FakeAdr, download_link, file_response
from tests.api.helpers import assert_failure, make_client
from tests.hintr import FakeHintr
from tests.support import ADR_KEY, ADR_TOKEN, USER, make_zip

FIT = "fit-task"
CALIBRATE = "calibrate-task"
NOTES = "Notes of the project\nline 2"

FAILED_ZIP = (
    "Cannot load model outputs. This fit was not generated on the Naomi web application. Please contact support."
)
MISSING_INPUT = "Unable to load output zip, input files not found. Please contact a system admin."
FIT_UNKNOWN = "Unable to load output zip, model fit not generated on the web app. Please contact a system admin."
CALIBRATE_UNKNOWN = (
    "Unable to load output zip, model calibrate not generated on the web app. Please contact a system admin."
)


def state_of(datasets: dict | None = None, fit: object = FIT, calibrate: object = CALIBRATE, **more) -> dict:
    return {
        "datasets": {} if datasets is None else datasets,
        "model_fit": {"id": fit, "options": {}},
        "calibrate": {"id": calibrate, "options": {}},
        **more,
    }


def output_zip(state: object = None, notes: str | bytes | None = NOTES, **others: str | bytes) -> bytes:
    """A zip as the app makes it: the state in `info/project_state.json` and the notes in `notes.txt`."""
    entries: dict[str, str | bytes] = {"info/project_state.json": json.dumps(state_of() if state is None else state)}
    if notes is not None:
        entries["notes.txt"] = notes
    return make_zip({**entries, **others})


def upload(content: bytes, name: str = "output.zip") -> dict:
    return {"files": {"file": (name, content, "application/zip")}}


def knows(hintr: FakeHintr, *task_ids: str) -> None:
    """hintr says that these tasks exist and any other does not, as hintr does."""

    def respond(request: httpx2.Request) -> httpx2.Response:
        task_id = request.url.path.split("/")[2]
        return httpx2.Response(200, json={"status": "success", "errors": None, "data": {"exists": task_id in task_ids}})

    hintr.respond = respond


def asked_hintr(hintr: FakeHintr) -> list[str]:
    return [f"{call.method} {call.url.path}" for call in hintr.calls]


def file_in(folder: Path, name: str) -> Path:
    path = folder / name
    path.write_bytes(b"a file")
    return path


@pytest_asyncio.fixture
async def rehydrator(hintr: FakeHintr, adr: FakeAdr, uploads_dir: Path) -> AsyncIterator[httpx2.AsyncClient]:
    """USER, with hintr that knows the fit and the calibration of `state_of`. The user has no version: rehydrate does
    not use one."""
    knows(hintr, FIT, CALIBRATE)
    async with make_client(USER) as client:
        yield client


async def rehydrate(client: httpx2.AsyncClient, content: bytes, **kwargs) -> httpx2.Response:
    return await client.post("/rehydrate/zip", **upload(content), **kwargs)


# ---- A good zip


async def test_a_good_zip_gives_the_notes_and_the_state_as_they_are(rehydrator, hintr):
    state = state_of(version={"hintr": "1.2.3"}, step=3, plot={"a": [1, 2.5, None, True], "b": "café"})

    r = await rehydrate(rehydrator, output_zip(state))

    assert r.status_code == 200
    assert r.json() == {"data": {"notes": NOTES, "state": state}, "errors": None, "status": "success"}
    # The order of the fields of the state is kept
    assert list(r.json()["data"]["state"]) == list(state)


async def test_hintr_is_asked_about_the_fit_and_then_the_calibration(rehydrator, hintr):
    await rehydrate(rehydrator, output_zip())

    assert asked_hintr(hintr) == [f"GET /task/{FIT}/exists", f"GET /task/{CALIBRATE}/exists"]


async def test_a_zip_with_no_notes_has_null_notes(rehydrator):
    r = await rehydrate(rehydrator, output_zip(notes=None))

    assert r.status_code == 200
    assert r.json()["data"]["notes"] is None


async def test_empty_notes_are_empty_and_not_null(rehydrator):
    r = await rehydrate(rehydrator, output_zip(notes=""))

    assert r.json()["data"]["notes"] == ""


async def test_notes_that_are_not_text_are_read_as_far_as_they_can_be(rehydrator):
    r = await rehydrator.post("/rehydrate/zip", **upload(output_zip(notes=b"ok \xff ok")))

    assert r.json()["data"]["notes"] == "ok � ok"


async def test_the_name_of_the_uploaded_file_does_not_matter(rehydrator):
    r = await rehydrator.post("/rehydrate/zip", **upload(output_zip(), "anything.txt"))

    assert r.status_code == 200


async def test_only_the_two_entries_are_read(rehydrator):
    """The zip of a real model has the results and the input files in it: it is not read, and it is not unpacked."""
    content = output_zip(
        **{
            "info/other.json": "{not read",
            "nested/info/project_state.json": '{"model_fit": "not the state"}',
            "notes.txt.bak": "not the notes",
            "Notes.txt": "not the notes",
            "output/": "",
        }
    )

    r = await rehydrate(rehydrator, content)

    assert r.status_code == 200
    assert r.json()["data"] == {"notes": NOTES, "state": state_of()}


async def test_a_zip_that_is_larger_than_the_memory_it_is_kept_in_is_read_from_the_disk(rehydrator, monkeypatch):
    # The upload is kept in memory up to 1 MB, and in a temporary file above that. Random bytes do not compress.
    content = output_zip(**{"output/results.bin": os.urandom(3 * 1024 * 1024)})
    assert len(content) > 3 * 1024 * 1024

    r = await rehydrate(rehydrator, content)

    assert r.status_code == 200
    assert r.json()["data"]["state"] == state_of()


async def test_nothing_is_stored_and_the_content_is_not_logged(rehydrator, uploads_dir, caplog):
    caplog.set_level(logging.DEBUG)

    await rehydrate(rehydrator, output_zip(state_of(hidden="a secret state"), notes="a secret note"))

    assert list(uploads_dir.iterdir()) == []
    assert "a secret" not in caplog.text


async def test_a_guest_may_load_a_zip(hintr, adr, uploads_dir):
    """The service has the ADR client of the request, which needs a credential only when it is used."""
    knows(hintr, FIT, CALIBRATE)
    async with make_client("guest") as guest:
        r = await rehydrate(guest, output_zip())

    assert r.status_code == 200


async def test_without_the_identity_headers_of_the_proxy_the_answer_is_401(hintr, adr, uploads_dir):
    transport = httpx2.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx2.AsyncClient(transport=transport, base_url="http://test") as client:
        r = await rehydrate(client, output_zip())

    assert_failure(r, 401, "Missing identity header")
    assert hintr.calls == []


# ---- A zip that cannot be used


@pytest.mark.parametrize(
    "content",
    [
        make_zip({"info/project_state.jsoX": "{}"}),
        make_zip({"notes.txt": "notes"}),
        make_zip({}),
        make_zip({"nested/info/project_state.json": "{}"}),
        make_zip({"Info/Project_State.json": "{}"}),
        b"this is not a zip",
        b"",
        b"PK\x05\x06" + b"\x00" * 18,
    ],
    ids=[
        "entry with another name",
        "no state",
        "empty zip",
        "state in a folder",
        "other case",
        "not a zip",
        "empty",
        "no entries",
    ],
)
async def test_a_file_without_the_state_is_refused(rehydrator, hintr, content):
    r = await rehydrate(rehydrator, content)

    assert_failure(r, 400, FAILED_ZIP)
    assert hintr.calls == []


@pytest.mark.parametrize(
    ("content", "reason"),
    [
        (b"this is not a zip", "zipfile.BadZipFile"),
        (output_zip(**{"output/results.bin": os.urandom(100_000)})[:60_000], "zipfile.BadZipFile"),
        # The directory of the zip is fine, but the data of the state is not (its checksum is wrong)
        (
            make_zip({"info/project_state.json": json.dumps(state_of())}, zipfile.ZIP_STORED).replace(
                b'"datasets"', b'"XXXXXXXX"'
            ),
            "zipfile.BadZipFile",
        ),
    ],
    ids=["not a zip", "cut short", "damaged entry"],
)
async def test_a_zip_that_cannot_be_read_is_refused_and_the_reason_is_logged(
    rehydrator, hintr, caplog, content, reason
):
    r = await rehydrate(rehydrator, content)

    assert_failure(r, 400, FAILED_ZIP)
    assert hintr.calls == []
    assert [
        (m.getMessage(), m.reason) for m in caplog.records if m.getMessage() == "The output zip cannot be read"
    ] == [("The output zip cannot be read", reason)]


@pytest.mark.parametrize(
    "state_text",
    [
        "{not json",
        "",
        "   ",
        '{"model_fit": {"id": "a"}',
        '{"a": NaN}',
        '{"a": Infinity}',
        '{"a": -Infinity}',
        '{"a": "\\ud800"}',
        '{"a": 1} {"b": 2}',
        "[" * 100_000,
        "\ufeff{}",
    ],
    ids=[
        "not JSON",
        "empty",
        "blank",
        "cut short",
        "NaN",
        "Infinity",
        "minus Infinity",
        "lone surrogate",
        "two values",
        "nested too deep",
        "byte order mark",
    ],
)
async def test_a_state_that_is_not_json_is_refused(rehydrator, hintr, caplog, state_text):
    r = await rehydrate(rehydrator, make_zip({"info/project_state.json": state_text.encode()}))

    assert_failure(r, 400, FAILED_ZIP)
    assert hintr.calls == []
    assert "The project state in the output zip is not JSON" in caplog.text


async def test_a_state_that_is_not_utf_8_is_refused(rehydrator):
    r = await rehydrate(rehydrator, make_zip({"info/project_state.json": b'{"a": "\xff"}'}))

    assert_failure(r, 400, FAILED_ZIP)


async def test_numbers_and_text_of_the_state_are_sent_back_with_their_value(rehydrator):
    text = (
        '{"datasets": {}, "model_fit": {"id": "fit-task"}, "calibrate": {"id": "calibrate-task"},'
        ' "big": 1000000000000000000000000000000, "negative": -123456789012345678901234567890,'
        ' "float": 0.1, "exponent": 1.5e300, "tiny": 5e-324, "long": 1.2345678901234567, "zero": -0.0,'
        ' "text": "caf\\u00e9 \\ud83d\\ude00 \\n \\"quoted\\"", "unused": null}'
    )

    r = await rehydrate(rehydrator, make_zip({"info/project_state.json": text}))

    assert r.status_code == 200
    state = r.json()["data"]["state"]
    assert state["big"] == 10**30
    assert state["negative"] == -123456789012345678901234567890
    assert (state["float"], state["exponent"], state["tiny"], state["long"]) == (
        0.1,
        1.5e300,
        5e-324,
        1.2345678901234567,
    )
    assert state["zero"] == 0
    assert state["text"] == 'café 😀 \n "quoted"'
    # The text of the answer has the integers as they are, with no rounding to a float
    assert b'"big":1000000000000000000000000000000' in r.content


@pytest.mark.parametrize(
    ("language", "detail"),
    [
        (
            "fr",
            "Impossible de charger les résultats du modèle. Cet ajustement n'a pas été généré sur l'application web Naomi. "
            "Veuillez contacter le support.",
        ),
        (
            "pt",
            "Não é possível carregar os resultados do modelo. Este ajuste não foi gerado na aplicação web Naomi. Por "
            "favor, contacte a assistência.",
        ),
    ],
)
async def test_a_zip_without_the_state_is_refused_in_the_language_of_the_request(rehydrator, language, detail):
    r = await rehydrate(rehydrator, b"not a zip", headers={"Accept-Language": language})

    assert_failure(r, 400, detail)


# ---- A zip that is made to use a lot of memory
#
# How an entry and the list of entries are limited is tested in tests/test_zip_files.py. These tests check that the limits
# of rehydrate are the ones that are used, and what the user and support see.


def too_big(caplog) -> bool:
    return [m.reason for m in caplog.records if m.getMessage() == "The output zip cannot be read"] == ["too big"]


async def test_a_state_that_expands_to_more_than_the_limit_is_refused_and_not_read_whole(
    rehydrator, hintr, caplog, monkeypatch
):
    monkeypatch.setattr("app.services.rehydrate_service.MAX_STATE_BYTES", 1000)
    # 1,001 bytes of spaces, in a zip that is small. The state of the limit that the code has is 20 MB, and this is the
    # same case.
    content = make_zip({"info/project_state.json": " " * 1001 + "{}"})
    assert len(content) < 300

    r = await rehydrate(rehydrator, content)

    assert_failure(r, 400, FAILED_ZIP)
    assert hintr.calls == []
    assert too_big(caplog)


async def test_a_state_at_the_limit_is_read(rehydrator, monkeypatch):
    state = json.dumps(state_of())
    monkeypatch.setattr("app.services.rehydrate_service.MAX_STATE_BYTES", len(state))

    r = await rehydrate(rehydrator, make_zip({"info/project_state.json": state}))

    assert r.status_code == 200


async def test_the_state_of_a_zip_bomb_is_refused_with_the_limit_of_the_code(rehydrator, caplog, hintr):
    """30 MB of spaces is 30 KB in the zip. Only the limit and a piece of it are read."""
    content = make_zip({"info/project_state.json": " " * (30 * 1024 * 1024) + "{}"})
    assert len(content) < 100_000

    r = await rehydrate(rehydrator, content)

    assert_failure(r, 400, FAILED_ZIP)
    assert hintr.calls == []
    assert too_big(caplog)


async def test_notes_that_expand_to_more_than_the_limit_are_refused(rehydrator, caplog, hintr, monkeypatch):
    monkeypatch.setattr("app.services.rehydrate_service.MAX_NOTES_BYTES", 100)

    r = await rehydrate(rehydrator, output_zip(notes="x" * 101))

    assert_failure(r, 400, FAILED_ZIP)
    assert hintr.calls == []
    assert too_big(caplog)


async def test_notes_at_the_limit_are_read(rehydrator, monkeypatch):
    monkeypatch.setattr("app.services.rehydrate_service.MAX_NOTES_BYTES", 100)

    r = await rehydrate(rehydrator, output_zip(notes="x" * 100))

    assert r.json()["data"]["notes"] == "x" * 100


async def test_a_zip_with_a_list_of_entries_that_is_too_big_is_refused(rehydrator, hintr, caplog):
    """Each entry takes 46 bytes of the list, and its name. This one has 1.5 MB of it, and no state."""
    content = make_zip({f"entries/entry-{i:06d}": "" for i in range(25_000)})
    assert len(content) > 1024 * 1024

    r = await rehydrate(rehydrator, content)

    assert_failure(r, 400, FAILED_ZIP)
    assert hintr.calls == []
    assert too_big(caplog)


# ---- The checks of the state


async def test_an_input_file_that_is_in_the_uploads_folder_is_found_by_the_name_in_its_path(rehydrator, uploads_dir):
    file_in(uploads_dir, "ABC.PJNZ")
    file_in(uploads_dir, "DEF.geojson")
    # The path is the one that hintr saw. Its folder is not looked at, only the last part
    datasets = {
        "pjnz": {"path": "/uploads/ABC.PJNZ", "filename": "x.pjnz"},
        "shape": {"path": "/anything/at/all/DEF.geojson"},
        "extra": {"path": "DEF.geojson"},
    }

    r = await rehydrate(rehydrator, output_zip(state_of(datasets)))

    assert r.status_code == 200


async def test_an_input_file_that_is_not_in_the_uploads_folder_is_refused_before_hintr_is_asked(
    rehydrator, hintr, uploads_dir
):
    file_in(uploads_dir, "ABC.PJNZ")
    datasets = {"pjnz": {"path": "/uploads/ABC.PJNZ"}, "shape": {"path": "/uploads/MISSING.geojson"}}

    r = await rehydrate(rehydrator, output_zip(state_of(datasets)))

    assert_failure(r, 400, MISSING_INPUT)
    assert hintr.calls == []


@pytest.mark.parametrize(
    "dataset",
    [
        {"filename": "x"},
        {"path": None},
        {"path": 5},
        {"path": ["ABC.PJNZ"]},
        {"path": ""},
        {"path": "/uploads/"},
        {"path": "/uploads/.."},
        {"path": "/uploads/."},
        {"path": "folder"},
        {"path": "/uploads/AB\x00C.PJNZ"},
        {"path": "/uploads/ABC.PJNZ/"},
        None,
        "ABC.PJNZ",
        ["ABC.PJNZ"],
        5,
    ],
    ids=lambda d: repr(d),
)
async def test_a_dataset_that_does_not_name_a_file_of_the_uploads_folder_is_refused(rehydrator, uploads_dir, dataset):
    file_in(uploads_dir, "ABC.PJNZ")
    (uploads_dir / "folder").mkdir()

    r = await rehydrate(rehydrator, output_zip(state_of({"pjnz": dataset})))

    assert_failure(r, 400, MISSING_INPUT)


@pytest.mark.parametrize("datasets", [None, [], [{"path": "nothing"}], "nothing", 5])
async def test_datasets_that_are_not_an_object_name_no_files(rehydrator, datasets):
    state = state_of(fit=FIT)
    state["datasets"] = datasets

    r = await rehydrate(rehydrator, output_zip(state))

    assert r.status_code == 200


async def test_a_state_without_datasets_is_good(rehydrator):
    state = state_of()
    del state["datasets"]

    r = await rehydrate(rehydrator, output_zip(state))

    assert r.status_code == 200


async def test_a_file_in_a_folder_of_the_uploads_folder_is_not_found(rehydrator, uploads_dir):
    """Only the last part of the path is used, so a name cannot lead out of the uploads folder, or into a folder in it."""
    (uploads_dir / "sub").mkdir()
    file_in(uploads_dir / "sub", "ABC.PJNZ")
    secret = uploads_dir.parent / "outside.txt"
    secret.write_text("x")

    for path in ("sub/ABC.PJNZ", "../outside.txt", "..\\outside.txt"):
        r = await rehydrate(rehydrator, output_zip(state_of({"a": {"path": path}})))
        assert_failure(r, 400, MISSING_INPUT)


async def test_a_model_fit_that_hintr_does_not_know_is_refused_and_the_calibration_is_not_asked(rehydrator, hintr):
    r = await rehydrate(rehydrator, output_zip(state_of(fit="unknown")))

    assert_failure(r, 400, FIT_UNKNOWN)
    assert asked_hintr(hintr) == ["GET /task/unknown/exists"]


async def test_a_calibration_that_hintr_does_not_know_is_refused(rehydrator, hintr):
    r = await rehydrate(rehydrator, output_zip(state_of(calibrate="unknown")))

    assert_failure(r, 400, CALIBRATE_UNKNOWN)
    assert asked_hintr(hintr) == [f"GET /task/{FIT}/exists", "GET /task/unknown/exists"]


@pytest.mark.parametrize(
    "task", [None, {}, {"id": None}, {"id": ""}, {"id": 5}, {"id": ["a"]}, {"id": True}, "id", [FIT]]
)
async def test_a_model_fit_with_no_id_is_refused_without_asking_hintr(rehydrator, hintr, task):
    state = state_of()
    state["model_fit"] = task

    r = await rehydrate(rehydrator, output_zip(state))

    assert_failure(r, 400, FIT_UNKNOWN)
    assert hintr.calls == []


@pytest.mark.parametrize("task", [None, {}, {"id": None}, {"id": ""}, {"id": 5}, "id", [CALIBRATE]])
async def test_a_calibration_with_no_id_is_refused_without_asking_hintr_again(rehydrator, hintr, task):
    state = state_of()
    state["calibrate"] = task

    r = await rehydrate(rehydrator, output_zip(state))

    assert_failure(r, 400, CALIBRATE_UNKNOWN)
    assert asked_hintr(hintr) == [f"GET /task/{FIT}/exists"]


async def test_a_state_that_has_no_fit_is_refused(rehydrator):
    state = state_of()
    del state["model_fit"]

    r = await rehydrate(rehydrator, output_zip(state))

    assert_failure(r, 400, FIT_UNKNOWN)


@pytest.mark.parametrize("state", [None, [], [1, 2], "state", 5, 2.5, True])
async def test_a_state_that_is_not_an_object_was_not_made_by_the_web_app(rehydrator, hintr, caplog, state):
    r = await rehydrate(rehydrator, make_zip({"info/project_state.json": json.dumps(state)}))

    assert_failure(r, 400, FAILED_ZIP)
    assert hintr.calls == []
    assert "The project state in the output zip is not an object" in caplog.text


async def test_an_object_that_has_no_fit_is_a_state_with_no_fit(rehydrator, hintr):
    r = await rehydrate(rehydrator, make_zip({"info/project_state.json": "{}"}))

    assert_failure(r, 400, FIT_UNKNOWN)
    assert hintr.calls == []


async def test_the_checks_are_made_in_order_whatever_is_wrong_with_the_later_ones(rehydrator, hintr, uploads_dir):
    """The state is checked for its shape once, but the first check that fails is still the one that is answered: a missing
    file, then the fit, then the calibration. A fit of a wrong shape does not hide a file that is missing, and a
    calibration of a wrong shape does not hide a fit that hintr does not know."""
    state = state_of({"x": {"path": "MISSING"}})
    state["model_fit"] = {}
    state["calibrate"] = None

    assert_failure(await rehydrate(rehydrator, output_zip(state)), 400, MISSING_INPUT)
    assert hintr.calls == []

    state = state_of(fit="unknown")
    state["calibrate"] = {"id": 5}

    assert_failure(await rehydrate(rehydrator, output_zip(state)), 400, FIT_UNKNOWN)
    assert asked_hintr(hintr) == ["GET /task/unknown/exists"]


async def test_the_id_of_a_task_cannot_change_the_call_to_hintr(rehydrator, hintr):
    await rehydrate(rehydrator, output_zip(state_of(fit="a/b?c#d e")))

    assert [call.url.raw_path for call in hintr.calls] == [b"/task/a%2Fb%3Fc%23d%20e/exists"]


@pytest.mark.parametrize(
    ("state", "language", "detail"),
    [
        (
            state_of({"x": {"path": "MISSING"}}),
            "fr",
            "Impossible de charger le fichier zip de sortie, les fichiers d'entrée n'ont pas été trouvés. Veuillez "
            "contacter un administrateur système.",
        ),
        (
            state_of({"x": {"path": "MISSING"}}),
            "pt",
            "Não é possível carregar o zip de saída, os ficheiros de entrada não foram encontrados. Contacte um "
            "administrador do sistema.",
        ),
        (
            state_of(fit="unknown"),
            "fr",
            "Impossible de charger le zip de sortie, l'ajustement du modèle n'a pas été généré sur l'application web. "
            "Veuillez contacter un administrateur système.",
        ),
        (
            state_of(fit="unknown"),
            "pt",
            "Não é possível carregar o zip de saída, o ajuste do modelo não foi gerado na aplicação Web. Contacte um "
            "administrador do sistema.",
        ),
        (
            state_of(calibrate="unknown"),
            "fr",
            "Impossible de charger le fichier zip de sortie, le calibrage du modèle n'a pas été généré sur l'application "
            "web. Veuillez contacter un administrateur système.",
        ),
        (
            state_of(calibrate="unknown"),
            "pt",
            "Não é possível carregar o zip de saída, a calibração do modelo não foi gerada na aplicação Web. Contacte um "
            "administrador do sistema.",
        ),
    ],
    ids=["input file fr", "input file pt", "fit fr", "fit pt", "calibration fr", "calibration pt"],
)
async def test_the_checks_are_answered_in_the_language_of_the_request(rehydrator, hintr, state, language, detail):
    r = await rehydrate(rehydrator, output_zip(state), headers={"Accept-Language": language})

    assert_failure(r, 400, detail)
    # hintr is asked in the same language
    assert all(call.headers["Accept-Language"] == language for call in hintr.calls)


async def test_a_failure_of_hintr_is_answered_as_hintr_failed_and_not_as_an_unknown_task(rehydrator, hintr):
    hintr.answer(500, json={"status": "failure", "errors": [{"error": "SERVER_ERROR", "detail": "boom"}], "data": None})

    r = await rehydrate(rehydrator, output_zip())

    assert r.status_code == 500
    assert r.json()["errors"] == [{"error": "SERVER_ERROR", "detail": "boom"}]


async def test_no_answer_from_hintr_is_answered_as_no_answer(rehydrator, hintr):
    hintr.fail_to_connect(httpx2.ConnectError("refused"))

    r = await rehydrate(rehydrator, output_zip())

    assert_failure(r, 500, "No response returned. The request may have timed out.")


@pytest.mark.parametrize("answer", [{"exists": "true"}, {"exists": 1}, {}, None, "yes", {"other": True}])
async def test_only_true_means_that_the_task_exists(rehydrator, hintr, answer):
    hintr.answer(200, json={"status": "success", "errors": None, "data": answer})

    r = await rehydrate(rehydrator, output_zip())

    assert_failure(r, 400, FIT_UNKNOWN)


# ---- The request


async def test_a_request_without_a_file_is_a_bad_request(rehydrator, hintr):
    r = await rehydrator.post("/rehydrate/zip")

    assert r.status_code == 400
    assert r.json()["errors"][0]["detail"].startswith("An unexpected error occurred.")
    assert hintr.calls == []


async def test_a_file_in_a_part_of_another_name_is_a_bad_request(rehydrator):
    r = await rehydrator.post("/rehydrate/zip", files={"other": ("o.zip", output_zip(), "application/zip")})

    assert r.status_code == 400


async def test_a_json_body_is_a_bad_request(rehydrator):
    r = await rehydrator.post("/rehydrate/zip", json={"file": "x"})

    assert r.status_code == 400


async def test_a_get_is_not_allowed(rehydrator):
    r = await rehydrator.get("/rehydrate/zip")

    assert r.status_code == 405


# ---- The size limit of the upload


def multipart(content: bytes) -> tuple[bytes, str]:
    boundary = "testboundary"
    body = (
        (
            f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="output.zip"\r\n'
            f"Content-Type: application/zip\r\n\r\n"
        ).encode()
        + content
        + f"\r\n--{boundary}--\r\n".encode()
    )
    return body, f"multipart/form-data; boundary={boundary}"


@pytest.fixture
def zip_limit(monkeypatch: pytest.MonkeyPatch) -> Callable[[int], None]:
    """Sets the size limit of an output zip for one test, for an upload and for a download from ADR. The real limit is
    500 MB."""

    def set_limit(limit: int) -> None:
        monkeypatch.setattr("app.services.rehydrate_service.MAX_OUTPUT_ZIP_BYTES", limit)
        monkeypatch.setitem(UPLOAD_LIMITS, UPLOAD_PATH, limit)

    return set_limit


async def test_the_limit_of_the_code_is_500_mb_for_an_upload_and_for_a_download():
    assert MAX_OUTPUT_ZIP_BYTES == 500 * 1024 * 1024
    assert UPLOAD_LIMITS[UPLOAD_PATH] == MAX_OUTPUT_ZIP_BYTES


async def test_an_upload_that_says_it_is_over_the_limit_is_refused_without_being_read(rehydrator, hintr, zip_limit):
    zip_limit(1000)

    r = await rehydrate(rehydrator, output_zip(**{"output/results.bin": os.urandom(5000)}))

    assert r.status_code == 413
    assert r.json() == {
        "data": {},
        "errors": [{"error": "FILE_TOO_LARGE", "detail": "The file is too large. Files can be up to 0 MB."}],
        "status": "failure",
    }
    assert hintr.calls == []


async def test_a_request_that_does_not_say_how_big_it_is_is_stopped_at_the_limit(rehydrator, hintr, zip_limit):
    zip_limit(1000)
    body, content_type = multipart(output_zip(**{"output/results.bin": os.urandom(5000)}))

    async def in_chunks():
        for start in range(0, len(body), 300):
            yield body[start : start + 300]

    # A generator has no length, so it is sent in chunks and there is no Content-Length to go by
    r = await rehydrator.post("/rehydrate/zip", content=in_chunks(), headers={"content-type": content_type})

    assert r.status_code == 413
    assert r.json()["errors"][0]["error"] == "FILE_TOO_LARGE"
    assert hintr.calls == []


async def test_a_request_that_says_less_than_it_sends_is_stopped_at_the_limit(rehydrator, hintr, zip_limit):
    zip_limit(1000)
    body, content_type = multipart(output_zip(**{"output/results.bin": os.urandom(5000)}))

    r = await rehydrator.post(
        "/rehydrate/zip", content=body, headers={"content-type": content_type, "content-length": "500"}
    )

    assert r.status_code == 413
    assert hintr.calls == []


async def test_an_upload_within_the_limit_is_read(rehydrator, zip_limit):
    content = output_zip()
    # The limit is on the whole request, which is the zip and a few hundred bytes for the form around it
    zip_limit(len(content) + 500)

    r = await rehydrate(rehydrator, content)

    assert r.status_code == 200


async def test_the_limit_is_said_in_the_language_of_the_request(rehydrator, zip_limit):
    zip_limit(3 * 1024 * 1024)
    big = output_zip(**{"output/results.bin": os.urandom(4 * 1024 * 1024)})

    english = await rehydrate(rehydrator, big)
    french = await rehydrate(rehydrator, big, headers={"Accept-Language": "fr"})

    assert english.json()["errors"][0]["detail"] == "The file is too large. Files can be up to 3 MB."
    assert (
        french.json()["errors"][0]["detail"]
        == "Le fichier est trop volumineux. Les fichiers peuvent faire jusqu'à 3 MB."
    )


async def test_the_limit_does_not_apply_to_other_requests(rehydrator, zip_limit):
    zip_limit(10)

    r = await rehydrator.post("/session/files", json={"pjnz": None})

    assert r.status_code != 413


# ---- A zip on ADR


LINK = download_link("d-output-1", "r3", "naomi_outputs.zip")


@pytest_asyncio.fixture
async def from_adr(
    adr: FakeAdr, hintr: FakeHintr, settings_overrides: dict, uploads_dir: Path
) -> AsyncIterator[httpx2.AsyncClient]:
    """USER in development, where ADR is called with the key of the settings. ADR is the fake ADR, at
    https://adr.example/, and hintr knows the tasks of `state_of`."""
    settings_overrides["environment"] = "development"
    settings_overrides["adr_api_key"] = ADR_KEY
    knows(hintr, FIT, CALIBRATE)
    async with make_client(USER) as client:
        yield client


def resource(link: str = LINK) -> dict:
    # What the Vue app sends: the resource of the dataset, with its link. It has no `datasetId` or `resourceId`.
    return {"id": "r3", "name": "naomi_outputs.zip", "lastModified": "2026-01-01", "outOfDate": False, "url": link}


async def rehydrate_from(client: httpx2.AsyncClient, link: str = LINK, **kwargs) -> httpx2.Response:
    return await client.post("/rehydrate/adr", json=resource(link), **kwargs)


async def test_a_zip_on_adr_gives_the_notes_and_the_state_as_an_upload_does(from_adr, adr, hintr):
    adr.serve(LINK, output_zip(state_of(step=3)))

    r = await rehydrate_from(from_adr)

    assert r.status_code == 200
    assert r.json() == {"data": {"notes": NOTES, "state": state_of(step=3)}, "errors": None, "status": "success"}
    assert asked_hintr(hintr) == [f"GET /task/{FIT}/exists", f"GET /task/{CALIBRATE}/exists"]


async def test_the_body_may_have_the_ids_of_the_dataset_and_they_are_not_used(from_adr, adr):
    adr.serve(LINK, output_zip())

    r = await from_adr.post("/rehydrate/adr", json={"url": LINK, "datasetId": "d-output-1", "resourceId": "r3"})

    assert r.status_code == 200
    # Only the file is asked for: not the activities of the dataset, which an import needs for the link to keep
    assert adr.queries("package_activity_list") == []
    assert str(adr.downloads()[0].url) == LINK


async def test_the_zip_is_downloaded_as_the_user_and_the_credential_stays_with_adr(from_adr, adr):
    adr.serve(LINK, output_zip())

    await rehydrate_from(from_adr)

    first, storage = adr.downloads()
    assert first.headers["Authorization"] == ADR_KEY
    # ADR redirects to its storage, which is on another address. The credential does not go there.
    assert str(storage.url).startswith(STORAGE)
    assert "Authorization" not in storage.headers
    assert len(adr.calls) == 2


async def test_with_a_token_the_zip_is_downloaded_as_the_user_of_the_token(from_adr, adr):
    adr.serve(LINK, output_zip())

    r = await rehydrate_from(from_adr, headers={"X-Hint-Access-Token": ADR_TOKEN})

    assert r.status_code == 200
    assert adr.downloads()[0].headers["Authorization"] == f"Bearer {ADR_TOKEN}"


async def test_with_a_token_and_no_key_the_zip_is_downloaded(adr, hintr, uploads_dir):
    adr.serve(LINK, output_zip())
    knows(hintr, FIT, CALIBRATE)
    async with make_client(USER) as client:
        r = await rehydrate_from(client, headers={"X-Hint-Access-Token": ADR_TOKEN})

    assert r.status_code == 200
    assert adr.downloads()[0].headers["Authorization"] == f"Bearer {ADR_TOKEN}"


async def test_without_a_token_or_a_key_nothing_is_asked_of_adr_and_the_user_is_told(adr, hintr, uploads_dir):
    async with make_client(USER) as client:
        r = await rehydrate_from(client)

    assert r.status_code == 400
    assert r.json()["errors"][0]["detail"].startswith("Could not find your ADR credentials.")
    assert adr.calls == []
    assert hintr.calls == []


async def test_without_a_credential_the_user_is_told_in_the_language_of_the_request(adr, uploads_dir):
    async with make_client(USER) as client:
        r = await rehydrate_from(client, headers={"Accept-Language": "fr"})

    assert r.json()["errors"][0]["detail"].startswith("Vos identifiants ADR sont introuvables.")


async def test_a_guest_may_not_load_a_zip_from_adr(from_adr, adr, hintr):
    adr.serve(LINK, output_zip())
    async with make_client("guest") as guest:
        r = await rehydrate_from(guest, headers={"X-Hint-Access-Token": ADR_TOKEN})

    assert_failure(r, 401, "Login required")
    assert adr.calls == []
    assert hintr.calls == []


async def test_without_the_identity_headers_of_the_proxy_adr_is_not_called(adr, settings_overrides):
    settings_overrides["environment"] = "development"
    settings_overrides["adr_api_key"] = ADR_KEY
    transport = httpx2.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx2.AsyncClient(transport=transport, base_url="http://test") as client:
        r = await rehydrate_from(client)

    assert_failure(r, 401, "Missing identity header")
    assert adr.calls == []


@pytest.mark.parametrize(
    "link",
    ["ftp://adr.example/x.zip", "/dataset/d/resource/r/download/x.zip", "not a url", "", "http://[adr.example/x.zip"],
)
async def test_a_link_that_is_not_an_http_address_is_refused_and_adr_is_not_called(from_adr, adr, hintr, link):
    r = await rehydrate_from(from_adr, link)

    assert_failure(r, 400, f"This link does not lead to ADR, so the file cannot be imported: {link}")
    assert adr.calls == []
    assert hintr.calls == []


@pytest.mark.parametrize("address", ["https://evil.example/", "https://dev-adr.example/", "http://adr.example:8443/"])
async def test_a_link_with_another_host_is_downloaded_from_adr_with_the_credential(from_adr, adr, address):
    adr.serve(LINK, output_zip())

    r = await rehydrate_from(from_adr, download_link("d-output-1", "r3", "naomi_outputs.zip", address))

    assert r.status_code == 200
    first = adr.downloads()[0]
    assert (str(first.url), first.headers["Authorization"]) == (LINK, ADR_KEY)


async def test_a_link_with_a_query_is_downloaded_with_it(from_adr, adr):
    adr.serve(LINK, output_zip())

    r = await rehydrate_from(from_adr, f"{LINK}?activity_id=act-1")

    assert r.status_code == 200
    assert str(adr.downloads()[0].url) == f"{LINK}?activity_id=act-1"


@pytest.mark.parametrize(
    ("adr_status", "status"), [(404, 404), (403, 403), (401, 401), (500, 500), (503, 503), (204, 500)]
)
async def test_a_zip_that_adr_does_not_give_is_an_error_with_its_link(from_adr, adr, hintr, adr_status, status):
    adr.answer(LINK, httpx2.Response(adr_status, text="no"))

    r = await rehydrate_from(from_adr)

    assert_failure(r, status, f"Unable to load resource, check resource in ADR {LINK}.")
    assert hintr.calls == []


@pytest.mark.parametrize(
    ("language", "detail"),
    [
        ("fr", f"Impossible de charger la ressource, vérifiez la ressource dans ADR {LINK}."),
        ("pt", f"Não é possível carregar o recurso, verifique o recurso no ADR {LINK}."),
    ],
)
async def test_a_zip_that_adr_does_not_give_is_an_error_in_the_language_of_the_request(from_adr, language, detail):
    r = await rehydrate_from(from_adr, headers={"Accept-Language": language})

    assert_failure(r, 404, detail)


async def test_a_login_page_in_place_of_the_zip_means_the_user_may_not_see_it(from_adr, adr, hintr):
    adr.redirect(LINK, "/user/login")
    adr.answer("https://adr.example/user/login", httpx2.Response(200, html="<html><title>login</title></html>"))

    r = await rehydrate_from(from_adr)

    assert_failure(
        r, 403, "You do not have permission to load this resource from ADR. Contact dataset admin for permission."
    )
    assert hintr.calls == []


async def test_no_answer_from_adr_is_an_error(from_adr, adr, hintr):
    adr.fail_to_download(LINK, httpx2.ConnectError("refused"))

    r = await rehydrate_from(from_adr)

    assert_failure(r, 500, "No response returned. The request may have timed out.")
    assert hintr.calls == []


async def test_a_file_on_adr_that_is_not_a_zip_is_refused(from_adr, adr, hintr):
    adr.serve(LINK, b"%PDF-1.4 a pdf", content_type="application/pdf")

    r = await rehydrate_from(from_adr)

    assert_failure(r, 400, FAILED_ZIP)
    assert hintr.calls == []


async def test_a_zip_on_adr_that_has_no_state_is_refused(from_adr, adr):
    adr.serve(LINK, make_zip({"other.txt": "x"}))

    r = await rehydrate_from(from_adr)

    assert_failure(r, 400, FAILED_ZIP)


async def test_a_zip_on_adr_with_a_calibration_that_hintr_does_not_know_is_refused(from_adr, adr):
    adr.serve(LINK, output_zip(state_of(calibrate="unknown")))

    r = await rehydrate_from(from_adr)

    assert_failure(r, 400, CALIBRATE_UNKNOWN)


async def test_a_zip_on_adr_that_expands_to_more_than_the_limit_of_the_state_is_refused(from_adr, adr, monkeypatch):
    monkeypatch.setattr("app.services.rehydrate_service.MAX_STATE_BYTES", 1000)
    adr.serve(LINK, make_zip({"info/project_state.json": " " * 5000 + "{}"}))

    r = await rehydrate_from(from_adr)

    assert_failure(r, 400, FAILED_ZIP)


@pytest.mark.parametrize("chunked", [False, True], ids=["with its size", "without its size"])
async def test_a_zip_bigger_than_the_limit_is_refused_as_it_is_downloaded(from_adr, adr, hintr, zip_limit, chunked):
    zip_limit(1024 * 1024)
    adr.serve(LINK, output_zip(**{"output/results.bin": os.urandom(1024 * 1024 + 1)}), chunked=chunked)

    r = await rehydrate_from(from_adr)

    assert r.status_code == 413
    assert r.json()["errors"] == [
        {"error": "FILE_TOO_LARGE", "detail": "The file is too large. Files can be up to 1 MB."}
    ]
    assert hintr.calls == []


@pytest.mark.parametrize("chunked", [False, True], ids=["with its size", "without its size"])
async def test_a_zip_at_the_limit_is_read(from_adr, adr, zip_limit, chunked):
    content = output_zip()
    zip_limit(len(content))
    adr.serve(LINK, content, chunked=chunked)

    r = await rehydrate_from(from_adr)

    assert r.status_code == 200


async def test_the_limit_of_the_zip_is_the_one_that_applies_and_not_the_one_of_an_input_file(
    from_adr, adr, zip_limit, upload_limits
):
    upload_limits(10)
    zip_limit(10 * 1024 * 1024)
    adr.serve(LINK, output_zip())

    r = await rehydrate_from(from_adr)

    assert r.status_code == 200


async def test_a_zip_bigger_than_memory_is_read_from_the_disk(from_adr, adr, monkeypatch):
    monkeypatch.setattr("app.clients.adr_client.IN_MEMORY_BYTES", 8)
    adr.answer(LINK, file_response(output_zip(**{"output/results.bin": os.urandom(100_000)}), chunked=True))

    r = await rehydrate_from(from_adr)

    assert r.status_code == 200
    assert r.json()["data"]["state"] == state_of()


async def test_nothing_is_stored_and_the_content_is_not_logged_when_the_zip_comes_from_adr(
    from_adr, adr, uploads_dir, caplog
):
    caplog.set_level(logging.DEBUG)
    adr.serve(LINK, output_zip(state_of(hidden="a secret state"), notes="a secret note"))

    await rehydrate_from(from_adr)

    assert list(uploads_dir.iterdir()) == []
    assert "a secret" not in caplog.text


async def test_a_body_without_a_link_is_a_bad_request(from_adr, adr):
    r = await from_adr.post("/rehydrate/adr", json={"datasetId": "d"})

    assert r.status_code == 400
    assert adr.calls == []


async def test_the_answer_of_adr_that_is_not_the_file_is_not_logged(from_adr, adr, caplog):
    caplog.set_level(logging.DEBUG)
    adr.answer(LINK, httpx2.Response(200, html="<html>Hello a-secret-name</html>"))

    await rehydrate_from(from_adr)

    assert "a-secret-name" not in caplog.text
