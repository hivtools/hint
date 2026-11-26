"""ADR, the UNAIDS data repository, which is a CKAN site. Users import their input files from it, and push their outputs
to it.

ADR answers in the format of CKAN: `{"success": true, "result": ...}`. It answers with status 200 for most failures. This
module turns each answer into one in the format of this API (a `HintResponse`), so the Vue app does not see the
difference.

The rules for what a user can choose are in `app/services/adr_datasets.py` (the datasets) and
`app/services/adr_release_service.py` (the releases, which also makes a new one). The rules for importing a file are in
`app/services/adr_imports.py`, and the rules for pushing a file to ADR are in `app/services/adr_resource_service.py`.
Those modules ask ADR through this one.

The user's credential goes only to ADR's address (`adr_url`). The HTTP client has that address as its base, and each
call is a path under it. A download from a link of the user is made from that address too, whatever the host in the link
is (see `AdrClient.file_at`).
"""

import asyncio
import json
import tempfile
from collections.abc import AsyncGenerator, Awaitable, Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass
from http.cookiejar import CookieJar, DefaultCookiePolicy
from io import BufferedReader
from pathlib import Path
from typing import IO, Annotated
from urllib.parse import quote, urlsplit

import httpx2
import structlog
from fastapi import Depends, Header, Request
from pydantic import SecretStr

from app.clients.responses import TIMEOUT_SECONDS, HintResponse, hint_status, parse_json
from app.config import Settings, get_settings
from app.dependencies import current_adr_access_token
from app.errors import (
    AdrResourceError,
    FileTooLargeError,
    HintError,
    NoAdrCredentialsError,
    NoPermissionToAccessResourceError,
    NoResponseFromAdrError,
    NotOnAdrError,
)
from app.messages import negotiate_language, t
from app.utils.byte_limit import MB, TooMuchData, within_limit_async
from app.utils.http_streams import read_in_thread

log = structlog.get_logger()

# A download is kept in memory up to this size. A larger one goes to a temporary file on the local disk.
IN_MEMORY_BYTES = 1 * MB

# The characters that stay as they are in a part of the path of a link (RFC 3986: unreserved, sub-delims, ":" and "@")
PATH_SAFE = "-._~!$&'()*+,;=:@"

# Who may see a new resource that a user pushes: only the people of the organisation "unaids" (CKAN reads this as JSON).
# The organisation of the dataset can open it up later on ADR.
RESTRICTED_TO_UNAIDS = '{"allowed_organizations":"unaids","allowed_users":"","level":"restricted"}'

# The time limits for the upload of a file. The output zip of a model can be 234 MB or more.
# - A limit of httpx is for one step, not for the whole call: one connection, one write of a part of the body, or one wait
#   for the next part of the answer. So an upload is not stopped at 120 seconds while ADR keeps taking the data. These
#   limits stay at `TIMEOUT_SECONDS`.
# - The wait for the answer is longer. After the last byte, ADR stores the file and then answers. For a big file this can
#   take more than 120 seconds.
# - It is not much longer than that, because Azure cancels the request of the browser after 240 seconds, and then nobody
#   hears the answer. 220 seconds leaves 20 for the calls that come before the upload (the hash and the check of the
#   resource). A user who sees an error may push again, and a new resource has then been made twice (see D19).
UPLOAD_ANSWER_SECONDS = 220
UPLOAD_TIMEOUT = httpx2.Timeout(TIMEOUT_SECONDS, read=UPLOAD_ANSWER_SECONDS)

# The header that gets CI past the firewall of the dev ADR (`adr_waf_bypass_secret`). Kotlin sends the same one.
WAF_BYPASS_HEADER = "X-Naomi-CI"


def create_adr_http_client(
    settings: Settings, transport: httpx2.AsyncBaseTransport | None = None
) -> httpx2.AsyncClient:
    """The HTTP client of every call to ADR. The app has one, which every user's calls share. `transport` is for the fake
    ADR of the tests.

    It does not connect yet, the first request does. httpx makes the base end with "/", and each call is a path under it.

    It keeps no cookies. Each call has its user's credential in its `Authorization` header, and needs nothing else. A
    cookie that ADR, its gateway or its storage set on the answer to one user's call would otherwise go with the calls of
    every other user. Kotlin keeps no cookies either.
    """
    hooks = []
    if settings.adr_waf_bypass_secret and settings.adr_waf_bypass_secret.get_secret_value():
        hooks.append(_waf_bypass_header(httpx2.URL(settings.adr_url), settings.adr_waf_bypass_secret))
    return httpx2.AsyncClient(
        base_url=settings.adr_url,
        timeout=TIMEOUT_SECONDS,
        cookies=_no_cookies(),
        transport=transport,
        event_hooks={"request": hooks},
    )


def _waf_bypass_header(adr_url: httpx2.URL, secret: SecretStr) -> Callable[[httpx2.Request], Awaitable[None]]:
    """A hook that puts the header `WAF_BYPASS_HEADER` on each request to ADR's address, and takes it off any other.

    httpx runs the hook again before each redirect it follows. A redirect keeps the headers of the request before it,
    so a download that ADR sends on to its storage would take the secret there too. httpx only drops `Authorization`.
    """

    async def hook(request: httpx2.Request) -> None:
        url = request.url
        if (url.scheme, url.host, url.port) == (adr_url.scheme, adr_url.host, adr_url.port):
            request.headers[WAF_BYPASS_HEADER] = secret.get_secret_value()
        else:
            request.headers.pop(WAF_BYPASS_HEADER, None)

    return hook


def _no_cookies() -> CookieJar:
    # A policy that allows no domain refuses every cookie, so the jar keeps none and sends none
    return CookieJar(policy=DefaultCookiePolicy(allowed_domains=[]))


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


def _not_json(status_code: int, body: bytes, language: str) -> HintResponse:
    text = body.decode("utf-8", errors="replace")
    # A gateway that cannot reach ADR answers with an HTML page. The page says what went wrong.
    if "504 Gateway Time-out" in text:
        log.error("ADR request timed out")
        return HintResponse.failure(504, t("adrTimeout", language))
    if "502 Bad Gateway" in text:
        log.error("ADR gateway failed")
        return HintResponse.failure(502, t("adrBadGateway", language))
    log.error("ADR answered with something that is not JSON", status=status_code)
    return HintResponse.failure(500, t("unparseableResponse", language))


def adr_answer(status_code: int, body: bytes, language: str = "en") -> HintResponse:
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
        return HintResponse(status, parsed)
    if isinstance(parsed, dict) and "success" in parsed:
        if parsed["success"] is True:
            return HintResponse.success(parsed.get("result"))
        # A failure with no message (a KeyError here) is an error that this API does not expect, so it is a 500.
        message = parsed["error"]["message"]
        # Do not log the message. It can have the name of a person in it (see "Personal data" in the README).
        log.error("ADR failed", status=status_code)
        return HintResponse.failure(500, str(message), "ADR_ERROR")
    if status < 400:
        return HintResponse.success(parsed)
    message = parsed if isinstance(parsed, str) else json.dumps(parsed)
    log.error("ADR failed", status=status_code)
    return HintResponse.failure(status, message)


@dataclass(frozen=True)
class ResourceUpload:
    """A file to put on ADR as a resource of a dataset, and what ADR is told about it."""

    # The file to send. It is read in pieces, and is not changed.
    path: Path
    # The name that ADR gives the file
    filename: str
    # The name of the resource
    name: str
    # The MD5 of the file, in upper case
    hash: str
    # The kind of resource (for example the one of an output zip), from app/services/file_types.py
    resource_type: str
    # Only the outputs have one
    description: str | None = None


def _action_path(action: str) -> str:
    """The path of one of the actions of CKAN, under the address of ADR."""
    return f"api/3/action/{action}"


def _open_for_reading(path: Path) -> BufferedReader:
    return path.open("rb")


class AdrClient:
    """Calls to ADR for one request, as the user who made it.

    Each method that calls ADR answers with a `HintResponse`, which is a failure if ADR did not answer as it should. This
    class knows how ADR (CKAN) is asked: the name of each action, the spelling of its parameters, and the format of its
    answer. The code that uses it does not.

    It looks for the credential only when it makes a call. An endpoint can then check its own parameters first. A wrong
    parameter is reported before the user hears that ADR cannot be called.
    """

    def __init__(self, http: httpx2.AsyncClient, authorization: SecretStr | None, language: str):
        """`http` has the address of ADR as its base."""
        self._http = http
        self._authorization = authorization
        self._language = language

    def file_at(self, link: str) -> AdrFile:
        """The file of ADR that the link leads to. Its path and query are downloaded from the address of ADR.

        The host in the link is not used. The browser sends the link, so it can lead to any site, and the user's
        credential must go only to ADR. A list of the hosts that are ADR is not used either: the links of an ADR can
        have a different host from its address (the links of the dev ADR do), and such a list would need to be kept up
        to date. A link to another site gets ADR's answer for its path, which is usually "not found".

        Raises `NotOnAdrError` if the link is not an http or https address, if its path is not under the path of ADR's
        address, or if it cannot be an address at all (it has a control character, or it is too long).
        """
        path = _path_under(link, str(self._http.base_url))
        if path is None:
            raise NotOnAdrError(link)
        try:
            url = self._http.base_url.join(path)
        except httpx2.InvalidURL:
            raise NotOnAdrError(link) from None
        return AdrFile(link, url)

    async def download(self, file: AdrFile, target: IO[bytes], max_bytes: int) -> HintResponse:
        """Writes the file into `target`. It is downloaded from the address of ADR, as the user. On success the data is
        null.

        ADR answers a download with a redirect to its storage, which has another address. The redirect is followed.
        httpx drops the `Authorization` header when a redirect leads to another address, so the credential stays with ADR.

        The storage does not say how big the file is, so the download is counted as it arrives. It is a failure:
        - 413 `FILE_TOO_LARGE` when the file passes `max_bytes`. The download stops at the first piece past it;
        - `adrResourceError` if ADR answers with another status than 200;
        - `noPermissionToAccessResource` if ADR answers with a web page (its login page) and not with the file;
        - `noResponse` if ADR does not answer.
        After a failure, `target` may have a part of the file.

        Raises `NoAdrCredentialsError` if there is no credential to call ADR, as every call does.
        """
        headers = self._authorization_header()
        try:
            async with self._http.stream("GET", file.url, headers=headers, follow_redirects=True) as r:
                # Do not log ADR's answer: a web page of ADR can have the name of the user in it.
                refused = _refused_download(r, file)
                if refused is not None:
                    return refused.hint_response(self._language)
                # Each piece as it arrives, so the download stops at the first piece past the limit
                async for chunk in within_limit_async(r.aiter_bytes(), max_bytes):
                    await asyncio.to_thread(target.write, chunk)
        except TooMuchData:
            log.warning("ADR file is too large", max_bytes=max_bytes)
            return FileTooLargeError(max_bytes).hint_response(self._language)
        except httpx2.RequestError:
            log.exception("No response from ADR to a download")
            return NoResponseFromAdrError().hint_response(self._language)
        return HintResponse.success(None)

    @asynccontextmanager
    async def spooled_download(self, file: AdrFile, max_bytes: int) -> AsyncGenerator[tuple[HintResponse, IO[bytes]]]:
        """Downloads the file (see `download`) into a temporary file, which is deleted when the block ends. It gives the
        answer of the download, and the file. If the answer is a failure, the file may have a part of the content.

        The file is in memory up to `IN_MEMORY_BYTES`, and on the local disk above that. It can seek. Its position is at the
        end of the content.
        """
        with tempfile.SpooledTemporaryFile(max_size=IN_MEMORY_BYTES) as content:
            yield await self.download(file, content, max_bytes), content

    async def resource_url(self, dataset_id: str, resource_id: str, filename: str) -> str:
        """The link to the file as it is now, to keep with the imported file: the download link of the resource, at the
        newest activity of its dataset.

        It is empty if ADR does not give the activities of the dataset, if the dataset has none, or if one of the three
        parts is empty. Then the dataset is not asked for.
        """
        if not (dataset_id and resource_id and filename):
            return ""
        answer = await self._get("package_activity_list", {"id": dataset_id})
        activities = answer.data if answer.ok else None
        # CKAN gives the newest activity first
        newest = activities[0] if isinstance(activities, list) and activities else None
        activity_id = newest.get("id") if isinstance(newest, dict) else None
        if not activity_id:
            return ""
        path = "/".join(
            quote(part, safe=PATH_SAFE)
            for part in ("dataset", dataset_id, "resource", resource_id, "download", filename)
        )
        return str(self._http.base_url.join(f"{path}?activity_id={quote(str(activity_id), safe='')}"))

    async def search_datasets(self, dataset_types: list[str], limit: int, show_inaccessible: bool) -> HintResponse:
        """The datasets of these types, at most `limit`. On success the data is the list of datasets.

        A dataset that has resources the user cannot use is only in the list if `show_inaccessible` is true.
        """
        params = {"q": f"type:({' OR '.join(dataset_types)})", "rows": str(limit), "include_private": "true"}
        if not show_inaccessible:
            params["hide_inaccessible_resources"] = "true"
        answer = await self._get("package_search", params)
        # CKAN puts the datasets in `results`, next to the number found
        return HintResponse.success(answer.data["results"]) if answer.ok else answer

    async def dataset(self, dataset_id: str, release: str | None = None) -> HintResponse:
        """One dataset. With a release, the dataset as it was at that release."""
        params = {"id": dataset_id}
        if release is not None:
            params["release"] = release
        return await self._get("package_show", params)

    async def releases(self, dataset_id: str) -> HintResponse:
        """The releases of a dataset. On success the data is a list."""
        return await self._get("dataset_version_list", {"dataset_id": dataset_id})

    async def delete_release(self, release_id: str) -> HintResponse:
        """Deletes a release. This API cannot undo it."""
        return await self._post("version_delete", {"version_id": release_id})

    async def create_release(self, dataset_id: str, name: str) -> HintResponse:
        """A release of the dataset as it is now, with this name. On success the data is the release."""
        return await self._post("dataset_version_create", {"dataset_id": dataset_id, "name": name})

    async def resource_hash(self, resource_id: str) -> HintResponse:
        """The hash that ADR has for a resource. On success the data is the hash, or null if ADR has none."""
        answer = await self._get("resource_show", {"id": resource_id})
        return HintResponse.success(answer.data.get("hash")) if answer.ok else answer

    async def create_resource(self, dataset_id: str, upload: ResourceUpload) -> HintResponse:
        """Puts the file on ADR as a new resource of the dataset. It is restricted to the organisation "unaids"."""
        fields = {**self._resource_fields(upload), "package_id": dataset_id, "restricted": RESTRICTED_TO_UNAIDS}
        return await self._post_file("resource_create", fields, upload)

    async def update_resource(self, resource_id: str, upload: ResourceUpload) -> HintResponse:
        """Replaces the file and the details of a resource that ADR has."""
        return await self._post_file("resource_patch", {**self._resource_fields(upload), "id": resource_id}, upload)

    @staticmethod
    def _resource_fields(upload: ResourceUpload) -> dict[str, str]:
        fields = {"name": upload.name, "hash": upload.hash, "resource_type": upload.resource_type}
        if upload.description is not None:
            fields["description"] = upload.description
        return fields

    async def organisations(self, permission: str) -> HintResponse:
        """The organisations where the user has the permission (for example, the permission to create datasets)."""
        return await self._get("organization_list_for_user", {"permission": permission})

    async def _get(self, action: str, params: dict[str, str]) -> HintResponse:
        """A read-only call of one of the actions of CKAN.

        The parameters are encoded. A value from the URL, such as a dataset id, cannot add parameters to the call.
        """
        request = self._http.build_request(
            "GET", _action_path(action), params=params, headers=self._authorization_header()
        )
        return await self._send(action, request)

    async def _post(self, action: str, form: dict[str, str]) -> HintResponse:
        """A call of one of the actions of CKAN that changes something. The parameters are in the body, as a form."""
        request = self._http.build_request(
            "POST", _action_path(action), data=form, headers=self._authorization_header()
        )
        return await self._send(action, request)

    async def _post_file(self, action: str, fields: dict[str, str], upload: ResourceUpload) -> HintResponse:
        """A call that sends a file, as the part `upload` of a multipart form, with the other parameters as its other
        parts. The file is read in pieces as it is sent, so a large file is not in memory. The length of the body is
        known, so it is sent with a `Content-Length`: a gateway of ADR may not take a chunked body."""
        # The credential is looked for first, as for every call: with none, the file is not opened and nothing is sent
        headers = self._authorization_header()
        handle = await asyncio.to_thread(_open_for_reading, upload.path)
        try:
            request = self._http.build_request(
                "POST",
                _action_path(action),
                data=fields,
                files={"upload": (upload.filename, handle)},
                headers=headers,
                timeout=UPLOAD_TIMEOUT,
            )
            read_in_thread(request)
            return await self._send(action, request)
        finally:
            await asyncio.to_thread(handle.close)

    async def _send(self, action: str, request: httpx2.Request) -> HintResponse:
        """Sends the request, and turns the answer into an answer of this API."""
        try:
            r = await self._http.send(request)
        except httpx2.RequestError:
            # The log has the message of the library. It has the address and has no headers.
            log.exception("No response from ADR", action=action)
            return NoResponseFromAdrError().hint_response(self._language)
        return adr_answer(r.status_code, r.content, self._language)

    def _authorization_header(self) -> dict[str, str]:
        """The header that makes a call as the user. Raises `NoAdrCredentialsError` if there is no credential, so that
        nothing is sent."""
        if self._authorization is None:
            log.warning("No credential to call ADR: there is no single sign-on token, and HINT_ADR_API_KEY is not set")
            raise NoAdrCredentialsError()
        return {"Authorization": self._authorization.get_secret_value()}


@dataclass(frozen=True)
class AdrFile:
    """A file on ADR, as a user gave its link."""

    # The link as the user gave it. Messages to the user show it.
    link: str
    # Where the file is downloaded from: ADR's address, then the part of the path of the link after the path of ADR's
    # address, and the query of the link
    url: httpx2.URL

    @property
    def filename(self) -> str:
        """The last part of the path of the link. CKAN puts the name of the file there."""
        return urlsplit(self.link).path.rsplit("/", 1)[-1]


def _path_under(link: str, address: str) -> str | None:
    """The part of the link after the path of the address (the rest of the path, and the query), or None if the link is
    not an http or https address, or its path does not start with the path of the address. The host is not compared."""
    try:
        url = urlsplit(link)
        base = urlsplit(address)
    except ValueError:  # For example, a host that starts with "[" and is not an IPv6 address
        return None
    prefix = base.path if base.path.endswith("/") else f"{base.path}/"
    if url.scheme.lower() not in ("http", "https") or not url.netloc or not url.path.startswith(prefix):
        return None
    rest = url.path.removeprefix(prefix)
    return f"{rest}?{url.query}" if url.query else rest


def _refused_download(r: httpx2.Response, file: AdrFile) -> HintError | None:
    """The error for an answer that is not the file, or None if it is the file. Its content is not read."""
    if r.status_code != 200:
        return AdrResourceError(r.status_code, file.link)
    # ADR shows its login page to a user who may not see the file. None of the input files is a web page.
    if r.headers.get("content-type", "").lower().startswith("text/html"):
        log.warning("ADR answered a download with a web page")
        return NoPermissionToAccessResourceError()
    return None


def get_adr_client(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
    access_token: Annotated[str | None, Depends(current_adr_access_token)],
    accept_language: Annotated[str | None, Header()] = None,
) -> AdrClient:
    return AdrClient(
        request.app.state.adr_http,
        adr_authorization(settings, access_token),
        negotiate_language(accept_language),
    )


Adr = Annotated[AdrClient, Depends(get_adr_client)]
