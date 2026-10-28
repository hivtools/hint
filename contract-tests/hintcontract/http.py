"""Tiny HTTP client with its own (manual) cookie jar.

We cannot use httpx's cookie jar because the Kotlin app marks its session cookie `Secure` while the test
environment is plain http, and because the cookie *name* differs between implementations (JSESSIONID vs ?).
"""
from __future__ import annotations

import http.cookies
import json as _json
import time
from dataclasses import dataclass, field
from typing import Any

import httpx


@dataclass
class Response:
    status: int
    headers: httpx.Headers
    content: bytes
    elapsed: float = 0.0
    set_cookie: list[str] = field(default_factory=list)

    @property
    def text(self) -> str:
        return self.content.decode("utf-8", "replace")

    def json(self) -> Any:
        return _json.loads(self.content)

    @property
    def data(self) -> Any:
        """`data` member of the standard hint response envelope."""
        return self.json()["data"]

    @property
    def content_type(self) -> str:
        return self.headers.get("content-type", "")


class Client:
    def __init__(self, base_url: str, name: str = "A", timeout: float = 300.0, host_header: str | None = None):
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.cookies: dict[str, str] = {}
        self._http = httpx.Client(timeout=timeout, follow_redirects=False)

    def close(self):
        self._http.close()

    def clear_cookies(self):
        self.cookies.clear()

    @property
    def has_session_cookie(self) -> bool:
        return bool(self.cookies)

    def _absorb_cookies(self, resp: httpx.Response) -> list[str]:
        raw = resp.headers.get_list("set-cookie")
        for line in raw:
            c = http.cookies.SimpleCookie()
            try:
                c.load(line)
            except http.cookies.CookieError:
                continue
            for k, morsel in c.items():
                if morsel["max-age"] == "0" or morsel.value == "" or (
                        morsel["expires"] and "1970" in morsel["expires"]):
                    self.cookies.pop(k, None)
                else:
                    self.cookies[k] = morsel.value
        return raw

    def send(self, method: str, path: str, *, params=None, headers: dict | None = None, json=None, data=None,
             files=None, content: bytes | None = None, send_cookies: bool = True, url: str | None = None) -> Response:
        hdrs = dict(headers or {})
        if send_cookies and self.cookies:
            hdrs["Cookie"] = "; ".join(f"{k}={v}" for k, v in self.cookies.items())
        t0 = time.perf_counter()
        target = url or (self.base_url + path)
        resp = self._http.request(method, target, params=params, headers=hdrs, json=json, data=data, files=files,
                                  content=content)
        raw_cookies = self._absorb_cookies(resp)
        return Response(resp.status_code, resp.headers, resp.content, time.perf_counter() - t0, raw_cookies)
