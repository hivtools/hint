import tomllib
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI

from app.config import get_settings
from app.db.database import create_db_session_factory, create_engine
from app.errors import register_error_handlers
from app.routers import items, projects

# pyproject.toml is the one place the version is set. The project is not installed as a package, so there is no
# package metadata to read it from.
VERSION = tomllib.loads((Path(__file__).parent.parent / "pyproject.toml").read_text())["project"]["version"]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    engine = create_engine(get_settings())
    app.state.db_session_factory = create_db_session_factory(engine)
    yield
    await engine.dispose()


app = FastAPI(lifespan=lifespan)
register_error_handlers(app)

app.include_router(items.router)
app.include_router(projects.router)


@app.get("/version")
async def version():
    return {"version": VERSION}
