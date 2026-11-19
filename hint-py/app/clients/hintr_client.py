"""The hintr API, the R service that validates inputs, builds chart data and runs the model.

hintr answers in the format the Vue app expects, so most answers are passed on as they are. What is not hintr's own
format is made to look like it (see `_hint_response`). Each call returns a `HintResponse`.
"""

import json
from collections.abc import Mapping
from typing import Annotated, Any
from urllib.parse import quote

import httpx2
import structlog
from fastapi import Depends, Header, Request
from pydantic_core import to_jsonable_python

from app.clients.responses import TIMEOUT_SECONDS, HintResponse, hint_status, parse_json
from app.config import Settings
from app.errors import HintrFailedError
from app.messages import negotiate_language, t
from app.schemas import DownloadResult, FileType, HintrFile, ModelOptions

log = structlog.get_logger()

# The files of a version, by type
FilesByType = Mapping[FileType, HintrFile]

# The baseline file types. hintr validates them against each other.
BASELINE_TYPES = (FileType.PJNZ, FileType.SHAPE, FileType.POPULATION)


def create_hintr_http_client(settings: Settings) -> httpx2.AsyncClient:
    # Does not connect yet, the first request does
    return httpx2.AsyncClient(base_url=settings.hintr_url, timeout=TIMEOUT_SECONDS)


def _hint_response(hintr_status: int, body: bytes, language: str) -> HintResponse:
    """hintr's answer, in the format of every answer of this API.

    An answer that has a `status` field already has that format. It goes to the browser as it is. Any other answer is
    wrapped: it is a success if hintr said so, and if not, it is a failure that has the answer as its message. An answer
    that is not JSON is a failure with the message "Could not parse response".
    """
    status = hint_status(hintr_status)
    is_json, parsed = parse_json(body)
    if not is_json:
        log.error("hintr answered with something that is not JSON", status=hintr_status, body=repr(body[:200]))
        return HintResponse.failure(500, t("unparseableResponse", language))

    if isinstance(parsed, dict) and "status" in parsed:
        return HintResponse(status, body)
    if status < 400:
        return HintResponse.success(parsed, status)
    # A string is the message as it is. Any other JSON becomes text.
    message = parsed if isinstance(parsed, str) else json.dumps(parsed)
    log.error("hintr failed", status=hintr_status, message=message)
    return HintResponse.failure(status, message)


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
        return _hint_response(r.status_code, r.content, negotiate_language(self._language))

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


def get_hintr_client(request: Request, accept_language: Annotated[str | None, Header()] = None) -> HintrClient:
    # The Accept-Language header is passed on as it is, hintr understands it (and "en" if there is none)
    return HintrClient(request.app.state.hintr_http, accept_language or "en")


Hintr = Annotated[HintrClient, Depends(get_hintr_client)]
