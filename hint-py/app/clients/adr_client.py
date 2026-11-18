"""ADR, the UNAIDS data repository, which is a CKAN site. Users import their input files from it, and push their outputs
to it.

ADR answers in the format of CKAN: `{"success": true, "result": ...}`. It answers with status 200 for most failures. This
module turns each answer into one in the format of this API (see `AdrAnswer`), so the Vue app does not see the
difference.

The rules for what a user can choose (which datasets and releases) are in `app/services/adr_datasets.py`. That module
asks ADR through this one.
"""

import json
import time
from dataclasses import dataclass
from typing import Annotated, Any

import httpx2
import structlog
from fastapi import Depends, Header, Request
from fastapi.responses import JSONResponse
from pydantic import SecretStr

from app.clients.responses import TIMEOUT_SECONDS, failure_content, hint_status, parse_json
from app.config import Settings, get_settings
from app.dependencies import current_adr_access_token
from app.errors import NoAdrCredentialsError
from app.messages import negotiate_language, t

log = structlog.get_logger()


def create_adr_http_client(settings: Settings) -> httpx2.AsyncClient:
    # Does not connect yet, the first request does.
    return httpx2.AsyncClient(base_url=f"{settings.adr_url.rstrip('/')}/api/3/action/", timeout=TIMEOUT_SECONDS)


def adr_authorization(settings: Settings, access_token: str | None) -> SecretStr | None:
    """The value of the `Authorization` header for a call to ADR, or None if there is none.

    - In a real deployment, every user logs in with single sign-on. The proxy passes their Auth0 access token to this
      API. Their calls go to ADR as them, with that token.
    - In development, the users have no token. If `adr_api_key` is set, every call uses that key. The key is the key of
      one user on ADR.

    This is a secret. Put it only in the header of the call to ADR. Never put it in a log, an error message or an
    answer.
    """
    if access_token:
        return SecretStr(f"Bearer {access_token}")
    if settings.adr_api_key and settings.adr_api_key.get_secret_value():
        return settings.adr_api_key
    return None


@dataclass(frozen=True)
class AdrAnswer:
    """The answer of ADR, in the format of this API.

    It has a status code, and a body with `data`, `errors` and `status`. It is a success (status 200), or a failure with
    the message of CKAN.
    """

    status_code: int
    content: dict[str, Any]

    @classmethod
    def success(cls, data: object) -> AdrAnswer:
        return cls(200, {"data": data, "errors": [], "status": "success"})

    @classmethod
    def failure(cls, status_code: int, detail: str, code: str = "OTHER_ERROR") -> AdrAnswer:
        return cls(status_code, failure_content(detail, code))

    @property
    def ok(self) -> bool:
        return self.status_code == 200

    @property
    def data(self) -> Any:
        return self.content["data"]

    def response(self) -> JSONResponse:
        # FastAPI sends this JSON as it is. It does not check or convert it again. This matters for a long list of
        # datasets.
        return JSONResponse(status_code=self.status_code, content=self.content)


def _not_json(status_code: int, body: bytes, language: str) -> AdrAnswer:
    text = body.decode("utf-8", errors="replace")
    # A gateway that cannot reach ADR answers with an HTML page. The page says what went wrong.
    if "504 Gateway Time-out" in text:
        log.error("ADR request timed out")
        return AdrAnswer.failure(504, t("adrTimeout", language))
    if "502 Bad Gateway" in text:
        log.error("ADR gateway failed")
        return AdrAnswer.failure(502, t("adrBadGateway", language))
    log.error("ADR answered with something that is not JSON", status=status_code)
    return AdrAnswer.failure(500, t("unparseableResponse", language))


def adr_answer(status_code: int, body: bytes, language: str = "en") -> AdrAnswer:
    """Turns the answer of ADR into an answer in the format of this API.

    - If the body is in the format of CKAN (it has `success`), a success gives the `result`. A failure gives status 500,
      the message of CKAN and the code ADR_ERROR. The status of ADR cannot be used: CKAN uses 200 for most failures.
    - If the body is JSON with no `success` and no `status`, it is a success when the status is a success. If not, it is
      a failure that has the JSON as its message.
    - If the body is not JSON, it is a failure. A gateway that is down gives an HTML page. For a 504 and a 502, the
      failure has its own message.
    """
    is_json, parsed = parse_json(body)
    if not is_json:
        return _not_json(status_code, body, language)

    status = hint_status(status_code)
    if isinstance(parsed, dict) and "status" in parsed:
        return AdrAnswer(status, parsed)
    if isinstance(parsed, dict) and "success" in parsed:
        if parsed["success"] is True:
            return AdrAnswer.success(parsed.get("result"))
        # A failure with no message (a KeyError here) is an error that this API does not expect, so it is a 500.
        message = parsed["error"]["message"]
        # Do not log the message. It can have the name of a person in it (see "Personal data" in the README).
        log.error("ADR failed", status=status_code)
        return AdrAnswer.failure(500, str(message), "ADR_ERROR")
    if status < 400:
        return AdrAnswer.success(parsed)
    message = parsed if isinstance(parsed, str) else json.dumps(parsed)
    log.error("ADR failed", status=status_code)
    return AdrAnswer.failure(status, message)


class AdrClient:
    """Calls to ADR for one request, as the user who made it.

    Each method is one question to ADR. This class knows how ADR (CKAN) is asked: the name of each action, the spelling
    of its parameters, and the format of its answer. The code that uses it does not.

    It looks for the credential only when it makes a call. An endpoint can then check its own parameters first. A wrong
    parameter is reported before the user hears that ADR cannot be called.
    """

    def __init__(self, http: httpx2.AsyncClient, authorization: SecretStr | None, language: str):
        self._http = http
        self._authorization = authorization
        self._language = language

    async def search_datasets(self, dataset_types: list[str], limit: int, show_inaccessible: bool) -> AdrAnswer:
        """The datasets of these types, at most `limit`. On success the data is the list of datasets.

        A dataset that has resources the user cannot use is only in the list if `show_inaccessible` is true.
        """
        params = {"q": f"type:({' OR '.join(dataset_types)})", "rows": str(limit), "include_private": "true"}
        if not show_inaccessible:
            params["hide_inaccessible_resources"] = "true"
        answer = await self._get("package_search", params)
        # CKAN puts the datasets in `results`, next to the number found
        return AdrAnswer.success(answer.data["results"]) if answer.ok else answer

    async def dataset(self, dataset_id: str, release: str | None = None) -> AdrAnswer:
        """One dataset. With a release, the dataset as it was at that release."""
        params = {"id": dataset_id}
        if release is not None:
            params["release"] = release
        return await self._get("package_show", params)

    async def releases(self, dataset_id: str) -> AdrAnswer:
        """The releases of a dataset. On success the data is a list."""
        return await self._get("dataset_version_list", {"dataset_id": dataset_id})

    async def organisations(self, permission: str) -> AdrAnswer:
        """The organisations where the user has the permission (for example, the permission to create datasets)."""
        return await self._get("organization_list_for_user", {"permission": permission})

    async def _get(self, action: str, params: dict[str, str]) -> AdrAnswer:
        """A read-only call of one of the actions of CKAN.

        The parameters are encoded. A value from the URL, such as a dataset id, cannot add parameters to the call.
        """
        authorization = self._authorization
        if authorization is None:
            log.warning("No credential to call ADR: there is no single sign-on token, and HINT_ADR_API_KEY is not set")
            raise NoAdrCredentialsError()
        started = time.perf_counter()
        try:
            r = await self._http.get(action, params=params, headers={"Authorization": authorization.get_secret_value()})
        except httpx2.RequestError:
            # The log has the message of the library. It has the address and has no headers.
            log.exception("No response from ADR", action=action)
            return AdrAnswer.failure(500, t("noResponse", self._language))
        log.info(
            "ADR request",
            action=action,
            status=r.status_code,
            duration_ms=round((time.perf_counter() - started) * 1000),
        )
        return adr_answer(r.status_code, r.content, self._language)


def get_adr_client(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
    access_token: Annotated[str | None, Depends(current_adr_access_token)],
    accept_language: Annotated[str | None, Header()] = None,
) -> AdrClient:
    return AdrClient(
        request.app.state.adr_http, adr_authorization(settings, access_token), negotiate_language(accept_language)
    )


Adr = Annotated[AdrClient, Depends(get_adr_client)]
