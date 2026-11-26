"""The server-side pages (Jinja2, autoescaped): the login page and the 404 page. The app itself is the static page of
the Vue build (app/routers/pages.py)."""

from pathlib import Path

from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory=Path(__file__).parent / "templates")
