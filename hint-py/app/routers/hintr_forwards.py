"""The calls that hint only passes on to hintr, with no files and no version (Kotlin: the controllers' one line methods).

Each one is a row of the table. To pass on another call that needs nothing else, add a row. Anything that has to look
at the request, or build the call from files, is a function of its own in a router.

Only what is in the table is passed on. hintr has routes that must not be reachable from the browser (it can stop its
workers, and write results straight into Redis), so there is no general "send everything under /model to hintr".
"""

import inspect
import re
from dataclasses import dataclass

from fastapi import APIRouter
from fastapi.responses import Response

from app.clients.hintr_client import Hintr


@dataclass(frozen=True)
class Forward:
    method: str
    path: str  # what the browser calls, the {names} are the path parameters
    # What is called on hintr, if it is not the same
    hintr_method: str | None = None
    hintr_path: str | None = None


FORWARDS = [
    Forward("GET", "/meta/hintr/version", hintr_path="/hintr/version"),
    Forward("GET", "/meta/adr/{task_id}"),
    Forward("GET", "/model/status/{task_id}"),
    Forward("GET", "/model/result/{task_id}"),
    Forward("POST", "/model/cancel/{task_id}"),
    Forward("GET", "/model/comparison/plot/{task_id}", hintr_path="/comparison/plot/{task_id}"),
    Forward("GET", "/calibrate/options/{iso3}", hintr_method="POST"),
    Forward("GET", "/calibrate/status/{task_id}"),
    Forward("GET", "/calibrate/result/metadata/{task_id}"),
    Forward("GET", "/calibrate/plot/{task_id}"),
    Forward("GET", "/download/status/{task_id}"),
]


def _endpoint(forward: Forward, hintr_method: str, hintr_path: str):
    async def endpoint(**kwargs) -> Response:
        hintr: Hintr = kwargs.pop("hintr")
        return await hintr.forward(hintr_method, hintr_path, kwargs)

    # FastAPI reads the path parameters, and so the API docs, from the signature. This one has the parameters of this
    # path, which are all text.
    names = re.findall(r"{(\w+)}", forward.path)
    endpoint.__signature__ = inspect.Signature(  # ty: ignore[unresolved-attribute]
        [inspect.Parameter(name, inspect.Parameter.KEYWORD_ONLY, annotation=str) for name in names]
        + [inspect.Parameter("hintr", inspect.Parameter.KEYWORD_ONLY, annotation=Hintr)]
    )
    return endpoint


def _add_forwards(router: APIRouter) -> None:
    for forward in FORWARDS:
        hintr_method = forward.hintr_method or forward.method
        hintr_path = forward.hintr_path or forward.path
        router.add_api_route(
            forward.path,
            _endpoint(forward, hintr_method, hintr_path),
            methods=[forward.method],
            name=f"{forward.method.lower()}{forward.path.replace('/', '_')}",
            tags=["hintr"],
            summary=f"Passed on to hintr: {hintr_method} {hintr_path}",
            response_class=Response,
        )


router = APIRouter()
_add_forwards(router)
