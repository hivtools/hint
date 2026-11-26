"""The hintr API, the R service that validates inputs, builds chart data and runs the model.

hintr answers in the format the Vue app expects, so most answers are passed on as they are. What is not hintr's own
format is made to look like it (see `HintResponse.from_service`). Each call returns a `HintResponse`.
"""

from collections.abc import AsyncIterator, Mapping
from typing import Annotated, Any
from urllib.parse import quote

import httpx2
import structlog
from fastapi import Depends, Header, Request
from fastapi.responses import StreamingResponse
from pydantic_core import to_jsonable_python
from starlette.background import BackgroundTask

from app.clients.responses import TIMEOUT_SECONDS, HintResponse
from app.config import Settings
from app.errors import HintrFailedError
from app.messages import negotiate_language, t
from app.schemas import DownloadResult, FileType, HintrFile, ModelOptions

log = structlog.get_logger()

# The files of a version, by type
FilesByType = Mapping[FileType, HintrFile]

# The baseline file types. hintr validates them against each other.
BASELINE_TYPES = (FileType.PJNZ, FileType.SHAPE, FileType.POPULATION)

# The headers of a file from hintr that go on to the browser with the file
FILE_HEADERS = ("content-type", "content-disposition", "content-length")


def create_hintr_http_client(settings: Settings) -> httpx2.AsyncClient:
    # Does not connect yet, the first request does
    return httpx2.AsyncClient(base_url=settings.hintr_url, timeout=TIMEOUT_SECONDS)


class HintrClient:
    """Calls to hintr on behalf of one request, so they carry that request's language (hintr translates its messages).

    It returns hintr's answer in the format of this API, which the router sends back to the browser.
    """

    def __init__(self, http: httpx2.AsyncClient, language: str):
        self._http = http
        self._language = language

    async def forward(
        self, method: str, path: str, params: Mapping[str, str] | None = None, json: object = None
    ) -> HintResponse:
        """Call hintr and return its answer. The {names} in the path are filled in from `params`, made safe first: a
        value from the URL cannot add path parts or a query string to the call.

        `json` is sent as the body, and without it there is no body.
        """
        path = path.format_map({name: quote(value, safe="") for name, value in (params or {}).items()})
        try:
            r = await self._http.request(
                method,
                path,
                headers={"Accept-Language": self._language},
                # Models (the files, the options) are written as hintr reads them
                json=None if json is None else to_jsonable_python(json, by_alias=True),
            )
        except httpx2.RequestError:
            log.exception("No response from hintr", method=method, path=path)
            return HintResponse.failure(500, t("noResponse", negotiate_language(self._language)))
        return HintResponse.from_service(r, negotiate_language(self._language))

    # The calls that have a body. The files are the ones hint looked up for the version, hintr reads them from the
    # uploads folder. Each of hintr's calls has its own shape: the files are the whole body, or under "data", or in
    # the body of the browser's request.

    async def model_options(self, files: FilesByType) -> HintResponse:
        return await self.forward("POST", "/model/options", json=files)

    async def validate_model_options(self, options: ModelOptions, files: FilesByType) -> HintResponse:
        return await self.forward("POST", "/validate/options", json={"options": options.options, "data": files})

    async def run_model(self, options: ModelOptions, files: FilesByType) -> HintResponse:
        return await self.forward("POST", "/model/submit", json={**options.model_dump(), "data": files})

    async def submit_calibration(self, run_id: str, options: ModelOptions) -> HintResponse:
        return await self.forward("POST", "/calibrate/submit/{run_id}", {"run_id": run_id}, options)

    async def input_time_series(self, file_type: FileType, files: FilesByType) -> HintResponse:
        return await self.forward(
            "POST", "/chart-data/input-time-series/{file_type}", {"file_type": file_type}, {"data": files}
        )

    async def input_comparison(self, files: FilesByType) -> HintResponse:
        return await self.forward("POST", "/chart-data/input-comparison", json=files)

    async def input_population(self, files: FilesByType) -> HintResponse:
        return await self.forward("POST", "/chart-data/input-population", json=files)

    async def validate_baseline_individual(self, file_type: FileType, file: HintrFile) -> HintResponse:
        return await self.forward("POST", "/validate/baseline-individual", json={"type": file_type, "file": file})

    async def validate_baseline_combined(self, files: FilesByType) -> HintResponse:
        """hintr receives only the paths, with one entry for each baseline file type. A file that the version does not
        have is null."""
        return await self.forward(
            "POST",
            "/validate/baseline-combined",
            json={file_type: files[file_type].path if file_type in files else None for file_type in BASELINE_TYPES},
        )

    async def validate_survey_and_programme(
        self, file_type: FileType, file: HintrFile, shape_path: str
    ) -> HintResponse:
        """Validates the survey, programme or ANC file against the shape file."""
        return await self.forward(
            "POST",
            "/validate/survey-and-programme",
            json={"type": file_type, "file": file, "shape": shape_path},
        )

    async def review_input_metadata(self, iso3: str, files: Mapping[str, HintrFile | None]) -> HintResponse:
        """The files are by the name of the type, and null where the version has no file of that type."""
        return await self.forward("POST", "/review-input/metadata", json={"data": files, "iso3": iso3})

    # The calls that hint needs the answer of, not only to pass it on. If hintr does not succeed, `HintrFailedError` is
    # raised with hintr's answer, and that answer is what the browser gets.

    async def _data(self, method: str, path: str, params: Mapping[str, str]) -> Any:
        answer = await self.forward(method, path, params)
        if not answer.ok:
            raise HintrFailedError(answer)
        return answer.data

    async def task_exists(self, task_id: str) -> bool:
        """Whether hintr knows the task. A task id that hintr has never seen is not an error: hintr answers that it does
        not exist."""
        data = await self._data("GET", "/task/{task_id}/exists", {"task_id": task_id})
        return isinstance(data, dict) and data.get("exists") is True

    async def calibrate_result_path(self, task_id: str) -> str:
        """Where the results database of a calibration is, relative to the results folder."""
        data = await self._data("GET", "/calibrate/result/path/{task_id}", {"task_id": task_id})
        return data["path"]

    async def download_result(self, task_id: str) -> DownloadResult:
        """Where the file of a download is, and what to call it."""
        data = await self._data("GET", "/download/result/path/{task_id}", {"task_id": task_id})
        return DownloadResult.model_validate(data)

    async def submit_download(self, download_type: str, task_id: str, payload: Mapping[str, Any]) -> HintResponse:
        """An empty payload is sent as no body at all."""
        return await self.forward(
            "POST",
            "/download/submit/{download_type}/{task_id}",
            {"download_type": download_type, "task_id": task_id},
            payload or None,
        )

    async def model_debug(self, task_id: str) -> StreamingResponse:
        """The debug zip of a model run: the task's inputs and options, for a developer to run it again.

        The zip goes on to the browser in pieces, as hintr sends it. It keeps hintr's content type, file name (in the
        Content-Disposition) and length. If hintr does not send the zip, `HintrFailedError` is raised with hintr's
        answer.
        """
        path = f"/model/debug/{quote(task_id, safe='')}"
        # "identity" asks hintr not to compress the zip. The bytes and the length then go on as hintr sent them.
        request = self._http.build_request(
            "GET", path, headers={"Accept-Language": self._language, "Accept-Encoding": "identity"}
        )
        language = negotiate_language(self._language)
        try:
            r = await self._http.send(request, stream=True)
        except httpx2.RequestError:
            log.exception("No response from hintr", method="GET", path=path)
            raise HintrFailedError(HintResponse.failure(500, t("noResponse", language))) from None
        if not r.is_success:
            try:
                await r.aread()
            except httpx2.RequestError:
                log.exception("No response from hintr", method="GET", path=path)
                raise HintrFailedError(HintResponse.failure(500, t("noResponse", language))) from None
            finally:
                await r.aclose()
            raise HintrFailedError(HintResponse.from_service(r, language))
        headers = {name: r.headers[name] for name in FILE_HEADERS if name in r.headers}
        headers.setdefault("content-type", "application/octet-stream")
        log.info("Sending the debug zip of a task", task=task_id, size=r.headers.get("content-length"))
        # The background task closes the answer of hintr if the stream never starts (the browser went away first)
        return StreamingResponse(_stream(r, path), headers=headers, background=BackgroundTask(r.aclose))


async def _stream(r: httpx2.Response, path: str) -> AsyncIterator[bytes]:
    """The body of hintr's answer, in pieces as they arrive. The answer is closed at the end, or if the browser goes away."""
    try:
        async for chunk in r.aiter_raw():
            yield chunk
    except httpx2.RequestError:
        # The status and the start of the file are sent already, so the browser cannot be told. The connection is cut
        # off, and the browser sees that the file is shorter than its length.
        log.exception("hintr stopped sending a file", path=path)
        raise
    finally:
        await r.aclose()


def get_hintr_client(request: Request, accept_language: Annotated[str | None, Header()] = None) -> HintrClient:
    # The Accept-Language header is passed on as it is, hintr understands it (and "en" if there is none)
    return HintrClient(request.app.state.hintr_http, accept_language or "en")


Hintr = Annotated[HintrClient, Depends(get_hintr_client)]
