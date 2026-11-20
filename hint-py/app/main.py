import tomllib
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI

from app.clients.adr_client import create_adr_http_client
from app.clients.github_client import create_github_http_client
from app.clients.hintr_client import create_hintr_http_client
from app.config import get_settings
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
    rehydrate,
    review_inputs,
)
from app.services.input_file_service import INPUT_FILE_TYPES
from app.services.rehydrate_service import MAX_OUTPUT_ZIP_BYTES, UPLOAD_PATH
from app.telemetry import trace_outgoing_calls
from app.upload_limit import UploadSizeLimitMiddleware

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
    yield
    await app.state.github_http.aclose()
    await app.state.adr_http.aclose()
    await app.state.hintr_http.aclose()
    await engine.dispose()


# The most that a request may be, for each path that uploads a file. The one table of the limits: the size limit middleware
# reads it as it is (it does not copy it).
UPLOAD_LIMITS = {spec.url: spec.max_upload_bytes for spec in INPUT_FILE_TYPES.values()} | {
    UPLOAD_PATH: MAX_OUTPUT_ZIP_BYTES
}

app = FastAPI(lifespan=lifespan)
register_error_handlers(app)
app.add_middleware(UploadSizeLimitMiddleware, limits=UPLOAD_LIMITS)

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


@app.get("/version")
async def version():
    return {"version": VERSION}
