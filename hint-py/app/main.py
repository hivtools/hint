"""The app: `create_app` makes it from the settings, and `app` is the one that `fastapi dev` and `fastapi run` serve.

The tests make an app of their own for each test, with their settings, a test database and fake hintr and ADR.
"""

import tomllib
from collections.abc import AsyncGenerator
from contextlib import AsyncExitStack, asynccontextmanager
from pathlib import Path

import httpx2
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.clients.adr_client import create_adr_http_client
from app.clients.hintr_client import create_hintr_http_client
from app.config import Settings
from app.db.database import create_db_session_factory, create_engine
from app.errors import register_error_handlers
from app.logging_setup import configure_logging
from app.routers import (
    adr,
    calibrate_results,
    downloads,
    hintr_forwards,
    input_files,
    items,
    model,
    projects,
    review_inputs,
)
from app.services.input_file_service import UPLOAD_LIMITS
from app.upload_limit import UploadSizeLimitMiddleware

# pyproject.toml is the one place the version is set. The project is not installed as a package, so there is no
# package metadata to read it from.
VERSION = tomllib.loads((Path(__file__).parent.parent / "pyproject.toml").read_text())["project"]["version"]


ROUTERS = (items, projects, input_files, hintr_forwards, review_inputs, model, downloads, calibrate_results, adr)

# The routes of the routers, made once when they are imported, and served by every app. `include_router` would make
# them again for each app, on its first request, which takes about 50 ms: once in every test, as each test has its own
# app. Nothing is added to them when they are included (no prefix, tags or dependencies), so they are the same routes.
# One thing is lost: `app.dependency_overrides` does not reach them. A test gives the app what it needs instead.
ROUTES = [route for module in ROUTERS for route in module.router.routes]


def create_app(
    settings: Settings,
    *,
    db_session_factory: async_sessionmaker[AsyncSession] | None = None,
    hintr_http: httpx2.AsyncClient | None = None,
    adr_http: httpx2.AsyncClient | None = None,
) -> FastAPI:
    """An app that uses `settings` everywhere: in the endpoints (`get_settings`), the error handlers and the upload limit.

    When the app starts, it sets up the logging and makes what it connects with: the database engine and the HTTP
    clients of hintr and ADR. It closes them when it stops. A test gives its own instead (a test database, fakes),
    which the app uses as they are and does not close. They are ready at once, because the test clients do not start
    the app.
    """

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
        configure_logging(settings)
        async with AsyncExitStack() as made:
            if db_session_factory is None:
                engine = create_engine(settings)
                made.push_async_callback(engine.dispose)
                app.state.db_session_factory = create_db_session_factory(engine)
            if hintr_http is None:
                app.state.hintr_http = create_hintr_http_client(settings)
                made.push_async_callback(app.state.hintr_http.aclose)
            if adr_http is None:
                app.state.adr_http = create_adr_http_client(settings)
                made.push_async_callback(app.state.adr_http.aclose)
            yield

    app = FastAPI(lifespan=lifespan, routes=ROUTES)
    app.state.settings = settings
    # None until the app starts, if not given
    app.state.db_session_factory = db_session_factory
    app.state.hintr_http = hintr_http
    app.state.adr_http = adr_http

    register_error_handlers(app)
    app.add_middleware(UploadSizeLimitMiddleware, settings=settings, limits=UPLOAD_LIMITS)

    @app.get("/version")
    async def version():
        return {"version": VERSION}

    return app


# The settings are read from the environment once, here
app = create_app(Settings())
