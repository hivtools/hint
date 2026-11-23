"""A limit on the size of an uploaded file.

It has to act on the request while it is being received. FastAPI reads the whole of a multipart body (into a temporary
file) before the endpoint runs, so a check in the endpoint would only find out after all of a huge file had been sent
and stored. There are two checks:

- a request that says it is too big (its Content-Length) is refused without reading it;
- one that does not say, or that says too little, is counted as it arrives and stopped once it is past the limit.

Disk space (Azure Container Apps, as at November 2026). FastAPI also copies each upload into a temporary file while it is
received (in memory up to 1 MB, then in the system temp directory), which is the replica's ephemeral storage and is
freed when the request ends. Azure gives a replica 1 GiB of it at 0.25 vCPU or less, 2 GiB at 0.5, 4 GiB at 1 and 8 GiB
above 1 vCPU (https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts), with no guarantee. At 1 vCPU (4 GiB),
about 10 uploads of the largest PJNZ (400 MB) can be in flight at once before it is full, and about 20 at 2 vCPU. The
biggest limit is the one of an output zip (500 MB, see `OUTPUT_ZIP` in app/services/upload_file_types.py): about 8 at
1 vCPU. A download from ADR is kept in a temporary file in the same way. Nothing here caps how many uploads run at once,
which is not a risk at that size: most files are a few MB, and the largest input file in use in November 2026 was 187 MB.
If a replica restarts during uploads, give uploads a byte budget (each one reserves its size before its body is read, and
waits if it is used up), or stream the body to the share and not to a temporary file.

The limit of each path is in app/services/upload_file_types.py, with each kind of file that can be uploaded. The
middleware reads it at each request, so a test can change a limit. The answer is the usual error for the browser: 413 and
a message in the language of the request. It applies to the request as a whole, which is a little more than the file in it.
"""

from collections.abc import Callable, Sequence

from starlette.datastructures import Headers
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.errors import FileTooLargeError, hint_error_response
from app.services.upload_file_types import UploadFileType


class UploadSizeLimitMiddleware:
    def __init__(self, app: ASGIApp, file_types: Callable[[], Sequence[UploadFileType]]):
        """`file_types` gives the kinds of file that can be uploaded. It is called at each POST request."""
        self.app = app
        self.file_types = file_types

    def _limit(self, scope: Scope) -> int | None:
        """The limit of the request in bytes, or None if it does not upload a file."""
        if scope["type"] != "http" or scope["method"] != "POST":
            return None
        return next((spec.max_upload_bytes for spec in self.file_types() if spec.url == scope["path"]), None)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        limit = self._limit(scope)
        if limit is None:
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)
        declared = headers.get("content-length", "")
        if declared.isdigit() and int(declared) > limit:
            await _refuse(scope, receive, send, limit)
            return
        await _CountedRequest(self.app, limit).run(scope, receive, send)


async def _refuse(scope: Scope, receive: Receive, send: Send, limit: int) -> None:
    accept_language = Headers(scope=scope).get("accept-language")
    await hint_error_response(FileTooLargeError(limit), accept_language)(scope, receive, send)


class _CountedRequest:
    """One request whose body is counted as it arrives, and stopped when it is past the limit."""

    def __init__(self, app: ASGIApp, limit: int):
        self.app = app
        self.limit = limit
        self.received = 0
        self.exceeded = False

    async def run(self, scope: Scope, receive: Receive, send: Send) -> None:
        async def counting_receive() -> Message:
            message = await receive()
            if message["type"] == "http.request":
                self.received += len(message.get("body", b""))
                if self.received > self.limit:
                    # The app sees the client go away, and answers as it sees fit (FastAPI says the body could not be
                    # read). That answer is replaced below.
                    self.exceeded = True
                    return {"type": "http.disconnect"}
            return message

        async def replacing_send(message: Message) -> None:
            if not self.exceeded:
                await send(message)
            elif message["type"] == "http.response.start":
                await _refuse(scope, receive, send, self.limit)

        await self.app(scope, counting_receive, replacing_send)
