import tomllib
from pathlib import Path

from fastapi import FastAPI

from routers import items

# pyproject.toml is the one place the version is set. The project is not installed as a package, so there is no
# package metadata to read it from.
VERSION = tomllib.loads((Path(__file__).parent / "pyproject.toml").read_text())["project"]["version"]

app = FastAPI()

app.include_router(items.router)


@app.get("/version")
async def version():
    return {"version": VERSION}
