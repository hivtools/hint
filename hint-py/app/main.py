import tomllib
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from starlette.middleware.gzip import DEFAULT_EXCLUDED_CONTENT_TYPES, GZipMiddleware

from app.clients.adr_client import create_adr_http_client
from app.clients.auth0_client import create_auth0_oauth_client
from app.clients.github_client import create_github_http_client
from app.clients.hintr_client import create_hintr_http_client
from app.clients.issue_reporter import create_issue_report_http_client
from app.config import get_settings
from app.db.database import create_db_session_factory, create_engine
from app.errors import register_error_handlers
from app.logging_setup import configure_logging
from app.middleware.upload_limit import UploadSizeLimitMiddleware
from app.routers import (
    adr,
    calibrate_results,
    downloads,
    error_report,
    hintr_forwards,
    input_files,
    items,
    login,
    me,
    model,
    pages,
    projects,
    rehydrate,
    review_inputs,
    users,
)
from app.services.file_types import upload_file_types
from app.telemetry import trace_outgoing_calls

# pyproject.toml is the one place the version is set. The project is not installed as a package, so there is no
# package metadata to read it from.
VERSION = tomllib.loads((Path(__file__).parent.parent / "pyproject.toml").read_text())["project"]["version"]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    configure_logging(get_settings())
    trace_outgoing_calls()
    engine = create_engine(get_settings())
    app.state.db_session_factory = create_db_session_factory(engine)
    app.state.hintr_http = create_hintr_http_client(get_settings())
    app.state.adr_http = create_adr_http_client(get_settings())
    app.state.github_http = create_github_http_client(get_settings())
    app.state.issue_report_http = create_issue_report_http_client()
    app.state.auth0_oauth = create_auth0_oauth_client(get_settings())
    yield
    await app.state.auth0_oauth.aclose()
    await app.state.issue_report_http.aclose()
    await app.state.github_http.aclose()
    await app.state.adr_http.aclose()
    await app.state.hintr_http.aclose()
    await engine.dispose()


app = FastAPI(lifespan=lifespan)
register_error_handlers(app)
app.add_middleware(UploadSizeLimitMiddleware, file_types=upload_file_types)
# Compress the answers of 1 KB or more, at zlib's default level, if the browser accepts gzip. That is the JSON of the API, and the page and the JavaScript and CSS of the front end.
# Not what is compressed already (zip files, images: Starlette's default list), and not the file downloads, which are
# sent as application/octet-stream and can be large.
app.add_middleware(
    GZipMiddleware,
    minimum_size=1024,
    compresslevel=6,
    exclude_content_types=(*DEFAULT_EXCLUDED_CONTENT_TYPES, "application/octet-stream"),
)

app.include_router(items.router)
app.include_router(projects.router)
app.include_router(input_files.router)
app.include_router(hintr_forwards.router)
app.include_router(review_inputs.router)
app.include_router(model.router)
app.include_router(downloads.router)
app.include_router(calibrate_results.router)
app.include_router(adr.router)
app.include_router(rehydrate.router)
app.include_router(error_report.router)
app.include_router(me.router)
app.include_router(login.router)
app.include_router(users.router)
app.include_router(pages.router)


@app.get("/version")
async def version():
    return {"version": VERSION}
