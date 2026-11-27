"""The Vue app itself: its one HTML page, and the files the build makes, at /public/.

The front-end build (`npm run build && npm run copy` in src/app/static) writes everything to one folder, `static_dir`:

- `index.html`: the page of the app. It has nothing in it but the tags that load the built JavaScript and CSS. It is the
  same for every user: the app asks GET /me who the user is when it starts.
- `assets/`: the JavaScript and CSS, with a hash of their contents in their names (`index-B0MUkABj.js`).
- files with fixed names: `images/`, `favicon.ico`, and `css/app.css` (the CSS of the server-side pages).

Two kinds of route serve them:

- `public_file`, `GET /public/{path}`: any file of the build, as it is. This is what the page's tags, and the images in
  it, ask for.
- `app_page`, for each route of the app (`/`, `/projects`, `/accessibility`, `/privacy`): always `index.html`. The app
  is a single page app, and vue-router reads the address and shows the right view in the browser. `/projects` is not a
  file, but the browser asks the server for it when the user reloads the page or opens a link or bookmark to it, so the
  server must answer with the page.

How long the browser may keep each, without asking the server again:

- The page: `no-cache`. The browser may keep it, but must ask each time whether it has changed (a 304 if not, thanks to
  the ETag). The page names the hashed files of one build. A page kept from before a deploy would ask for files that a
  new deploy no longer has, and the app would not start.
- `assets/`: a year, and not even on a reload (`immutable`). A new build gives a changed file a new name, so a kept
  file is never out of date.
- The files with fixed names: no Cache-Control. The browser decides, and sees a new file when it next asks.

None of this needs a user, so nothing here asks who the user is.
"""

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import PlainTextResponse
from starlette.staticfiles import StaticFiles

from app.config import Settings, get_settings

router = APIRouter(tags=["pages"], include_in_schema=False)

# vue-router's routes (src/app/static/src/app/router.ts). Add a route there, add it here
APP_PAGES = ["/", "/projects", "/accessibility", "/privacy"]
PAGE_CACHE_CONTROL = "no-cache"
HASHED_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable"


@lru_cache
def _files(directory: str) -> StaticFiles:
    # StaticFiles answers a conditional request (If-None-Match) with a 304 and a HEAD with no body, and does not serve a
    # file outside the folder. It is made at the first request, and in development the build may not exist yet:
    # `check_dir=False` stops it failing (a 500) when the folder is missing, so the request gets a 404 instead.
    return StaticFiles(directory=directory, check_dir=False)


SettingsDep = Annotated[Settings, Depends(get_settings)]


@router.api_route("/public/{path:path}", methods=["GET", "HEAD"])
async def public_file(path: str, request: Request, settings: SettingsDep) -> Response:
    """A file of the build: the JavaScript and CSS the page loads, images, the favicon."""
    response = await _files(settings.static_dir).get_response(path, request.scope)
    if path.startswith("assets/"):
        response.headers["Cache-Control"] = HASHED_ASSET_CACHE_CONTROL
    return response


async def app_page(request: Request, settings: SettingsDep) -> Response:
    """The page of the app, the same for every route (see the top of this file)."""
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
