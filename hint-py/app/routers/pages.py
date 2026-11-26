"""The Vue app itself: its page, and the built files at /public/.

The front-end build (src/app/static, `npm run build` then `npm run copy`) writes everything to one folder,
`static_dir`. In it, `index.html` is the page of the app, with the tags of the built files. It is the same for every
user: the app asks GET /me who the user is. The page is sent for each path of the app that the browser can open
(the routes of vue-router), so that a reload or a link to one of them works.

- The page may change with each deploy, so the browser must ask again each time (`no-cache`), and it gets a 304 if the
  page has not changed.
- The files in `assets/` have a hash of their contents in their names, so a new build gives them new names. The
  browser may keep them for a year and need not ask again, even on a reload (`immutable`).
- The other files (images, the favicon, the CSS of the login page) have fixed names. They get no Cache-Control, as in
  Kotlin, and the browser asks again when it decides to.

None of this needs a user: the proxy sends these paths here without asking who the user is.
"""

import posixpath
from functools import lru_cache
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import PlainTextResponse
from starlette.staticfiles import StaticFiles

from app.config import Settings, get_settings

router = APIRouter(tags=["pages"], include_in_schema=False)

# vue-router's routes (src/app/static/src/app/router.ts)
APP_PAGES = ["/", "/projects", "/accessibility", "/privacy"]
PAGE_CACHE_CONTROL = "no-cache"
HASHED_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable"


@lru_cache
def _files(directory: str) -> StaticFiles:
    # StaticFiles answers a conditional request with a 304, a HEAD with no body, and does not serve files outside the
    # folder (a path with "..", or a link that points out of it)
    return StaticFiles(directory=directory, check_dir=False)


SettingsDep = Annotated[Settings, Depends(get_settings)]


@router.api_route("/public/{path:path}", methods=["GET", "HEAD"])
async def public_file(path: str, request: Request, settings: SettingsDep) -> Response:
    response = await _files(settings.static_dir).get_response(path, request.scope)
    # As the file that was served sees it: "assets/../index.html" is the page, not an asset
    if posixpath.normpath(path).startswith("assets/"):
        response.headers["Cache-Control"] = HASHED_ASSET_CACHE_CONTROL
    return response


async def app_page(request: Request, settings: SettingsDep) -> Response:
    if not (Path(settings.static_dir) / "index.html").is_file():
        # Only in development, before the first build: a deployed image has the built files
        return PlainTextResponse(
            "The front end has not been built. Run `npm run build && npm run copy` in src/app/static.",
            status_code=503,
        )
    response = await _files(settings.static_dir).get_response("index.html", request.scope)
    response.headers["Cache-Control"] = PAGE_CACHE_CONTROL
    return response


for page in APP_PAGES:
    router.add_api_route(page, app_page, methods=["GET", "HEAD"])
