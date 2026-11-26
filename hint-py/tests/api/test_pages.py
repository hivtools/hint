"""The page of the Vue app, and the built files at /public/ (app/routers/pages.py)."""

from pathlib import Path

import httpx2
import pytest

from app.routers.pages import APP_PAGES

PAGE = "<!DOCTYPE html><html><body><div id=app></div></body></html>"


@pytest.fixture
def static_dir(tmp_path: Path, settings_overrides: dict) -> Path:
    """A built front end, as `npm run build && npm run copy` leaves it."""
    (tmp_path / "index.html").write_text(PAGE)
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "index-abc123.js").write_text("console.log(1)")
    (tmp_path / "css").mkdir()
    (tmp_path / "css" / "app.css").write_text("body {}")
    (tmp_path / "favicon.ico").write_bytes(b"\x00\x00\x01\x00")
    settings_overrides["static_dir"] = str(tmp_path)
    return tmp_path


@pytest.mark.parametrize("path", APP_PAGES)
async def test_each_page_of_the_app_is_the_built_page(
    anonymous_client: httpx2.AsyncClient, static_dir: Path, path: str
):
    # No identity headers: nobody needs to be logged in to get the page. The app then asks GET /me
    r = await anonymous_client.get(path)

    assert r.status_code == 200
    assert r.text == PAGE
    assert r.headers["content-type"].startswith("text/html")


async def test_the_page_is_checked_again_each_time(anonymous_client: httpx2.AsyncClient, static_dir: Path):
    # A deploy changes the page (it names the new files), so the browser must not use a copy it has without asking
    r = await anonymous_client.get("/")

    assert r.headers["cache-control"] == "no-cache"
    assert "etag" in r.headers


async def test_an_unchanged_page_is_a_304(anonymous_client: httpx2.AsyncClient, static_dir: Path):
    first = await anonymous_client.get("/projects")

    r = await anonymous_client.get("/projects", headers={"If-None-Match": first.headers["etag"]})

    assert r.status_code == 304
    assert r.headers["cache-control"] == "no-cache"


async def test_the_page_answers_head(anonymous_client: httpx2.AsyncClient, static_dir: Path):
    r = await anonymous_client.head("/")

    assert r.status_code == 200
    assert r.content == b""


async def test_without_a_build_the_page_says_how_to_make_one(
    anonymous_client: httpx2.AsyncClient, tmp_path: Path, settings_overrides: dict
):
    settings_overrides["static_dir"] = str(tmp_path / "missing")

    r = await anonymous_client.get("/")

    assert r.status_code == 503
    assert "npm run build" in r.text


async def test_hashed_assets_are_kept_for_a_year(anonymous_client: httpx2.AsyncClient, static_dir: Path):
    r = await anonymous_client.get("/public/assets/index-abc123.js")

    assert r.status_code == 200
    assert r.text == "console.log(1)"
    assert r.headers["cache-control"] == "public, max-age=31536000, immutable"
    assert "javascript" in r.headers["content-type"]


@pytest.mark.parametrize("path", ["/public/css/app.css", "/public/favicon.ico", "/public/index.html"])
async def test_files_with_fixed_names_get_no_cache_control(
    anonymous_client: httpx2.AsyncClient, static_dir: Path, path: str
):
    # As in Kotlin: the browser decides when to ask again, and a new build is seen when it does
    r = await anonymous_client.get(path)

    assert r.status_code == 200
    assert "cache-control" not in r.headers


async def test_a_missing_file_is_a_404(anonymous_client: httpx2.AsyncClient, static_dir: Path):
    r = await anonymous_client.get("/public/assets/gone-123.js")

    assert r.status_code == 404


@pytest.mark.parametrize(
    "path", ["/public/../secret.txt", "/public/%2e%2e/secret.txt", "/public/assets/..%2f..%2fsecret.txt"]
)
async def test_no_file_outside_the_folder_is_served(anonymous_client: httpx2.AsyncClient, static_dir: Path, path: str):
    (static_dir.parent / "secret.txt").write_text("secret")

    r = await anonymous_client.get(path)

    assert r.status_code == 404
    assert "secret" not in r.text


async def test_a_path_out_of_assets_is_not_kept_for_a_year(anonymous_client: httpx2.AsyncClient, static_dir: Path):
    r = await anonymous_client.get("/public/assets/..%2findex.html")

    assert r.status_code == 200
    assert "cache-control" not in r.headers


async def test_the_built_files_are_gzipped(anonymous_client: httpx2.AsyncClient, static_dir: Path):
    # As Kotlin did (Spring Boot's server.compression). The JavaScript of the app is most of what a first visit downloads
    # Bytes, not text: Windows would write "\r\n"
    (static_dir / "assets" / "vendor-abc123.js").write_bytes(b"var x = 1;\n" * 1000)

    r = await anonymous_client.get("/public/assets/vendor-abc123.js", headers={"Accept-Encoding": "gzip"})

    assert r.headers["content-encoding"] == "gzip"
    assert int(r.headers["content-length"]) < 11000
    assert r.content == b"var x = 1;\n" * 1000


async def test_small_files_are_not_gzipped(anonymous_client: httpx2.AsyncClient, static_dir: Path):
    r = await anonymous_client.get("/public/css/app.css", headers={"Accept-Encoding": "gzip"})

    assert "content-encoding" not in r.headers
