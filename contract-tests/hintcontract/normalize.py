"""Replace volatile values (ids, timestamps, tokens, paths) with stable tokens.

Tokens are numbered by first appearance *within one scenario* (the Normalizer lives as long as the scenario);
dict keys are visited in sorted order so numbering does not depend on the server's JSON key order.
Because the scenario code itself is what drives the requests, "re-binding" is simply: the test uses the real value
it got from an earlier response, while goldens only ever contain the tokens.
"""
from __future__ import annotations

import re
from typing import Any

from .env import Env

UUID_RE = re.compile(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")
JWT_RE = re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*")
TS_RE = re.compile(r"\d{4}-\d\d-\d\d[T ]\d\d:\d\d:\d\d(?:[.,]\d+)?(?:Z|[+-]\d\d:?\d\d)?")
TS_DASH_RE = re.compile(r"\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d(?:[.,]\d+)?Z?")      # Instant used as a file name
COMPACT_TS_RE = re.compile(r"(?<!\d)20\d{6}-\d{4,6}(?!\d)")                      # hintr iso_time_str(): 20261021-1423
ERROR_CODE_RE = re.compile(r"\bu(?:[a-z]{2}-[a-z]{3}-[a-z]{3}|[0-9a-f]{8})\b")      # hint "unexpected error" code (Kotlin, Python)
ERROR_KEY_RE = re.compile(r"\b[a-z]{5}-[a-z]{5}-[a-z]{5}\b")                     # hintr error "key"
ELAPSED_RE = re.compile(r"[\d.]+ ?m?s elapsed")
STATE_RE = re.compile(r"([?&]state=)[^&\s\"]+")
HEX32_RE = re.compile(r"(?<![0-9A-Za-z])[0-9a-f]{32}(?![0-9A-Za-z])")                # hintr/rrq task ids
PROJECT_PATH_RE = re.compile(r"(/project/)(\d+)")


class Normalizer:
    def __init__(self, env: Env):
        self.env = env
        self.maps: dict[str, dict[str, str]] = {}
        self.bound: list[tuple[str, str]] = []   # (real, token) explicit bindings, longest first
        self.project_ids: dict[int, str] = {}
        self.keep_hex = False   # True while normalising stub calls whose lowercase md5 hashes are real content
        self._replacements: list[tuple[str, str]] = []
        # hint normally sends hintr a *relative* upload path ("uploads/<HASH>"; hintr, running in "/", sees it as
        # "/uploads/<HASH>").  Only a folder name followed by an upload file name (32 hex digits and a dot) is replaced,
        # so the word "uploads" elsewhere in a message is left alone.
        self._relative_uploads: re.Pattern | None = None
        prefix = env.hintr_uploads_prefix
        if prefix and not prefix.startswith("/"):
            self._relative_uploads = re.compile(
                r"(?<![\w.-])/?" + re.escape(prefix.strip("/")) + r"/(?=[0-9A-Fa-f]{32}\.)")
            prefix = None
        for real, token in (
            (prefix, "<UPLOADS>"),
            (str(env.uploads_dir) if env.uploads_dir else None, "<UPLOADS>"),
            (str(env.results_dir) if env.results_dir else None, "<RESULTS>"),
            (env.adr_sso_url.rstrip("/"), "<ADR_SSO>"),
            (env.adr_url.rstrip("/"), "<ADR>"),
            (env.app_public_url.rstrip("/"), "<APP>"),
            ((env.sso_base_url or "").rstrip("/") or None, "<APP>"),
            (env.idp_host, "<IDP_HOST>"),
        ):
            if real:
                self._replacements.append((real, token))
        self._replacements.sort(key=lambda t: -len(t[0]))

    # -- registries ---------------------------------------------------------------------------------
    def bind(self, kind: str, real: str, label: str | None = None) -> str:
        """Explicitly register `real` (e.g. a task id) -> `<KIND:label>`; label defaults to a counter."""
        if real is None:
            return real
        real = str(real)
        for r, t in self.bound:
            if r == real:
                return t
        if label is None:
            n = len([1 for r, t in self.bound if t.startswith(f"<{kind}:")]) + 1
            label = str(n)
        token = f"<{kind}:{label}>"
        self.bound.append((real, token))
        self.bound.sort(key=lambda t: -len(t[0]))
        return token

    def _auto(self, kind: str, real: str) -> str:
        m = self.maps.setdefault(kind, {})
        key = real.lower() if kind == "UUID" else real
        if key not in m:
            m[key] = f"<{kind}:{len(m) + 1}>"
        return m[key]

    def project(self, pid: int) -> str:
        if pid not in self.project_ids:
            self.project_ids[pid] = f"<PROJECT:{len(self.project_ids) + 1}>"
        return self.project_ids[pid]

    # -- strings --------------------------------------------------------------------------------------
    def string(self, s: str) -> str:
        for real, token in self.bound:
            if real in s:
                s = s.replace(real, token)
        for real, token in self._replacements:
            if real in s:
                s = s.replace(real, token)
        if self._relative_uploads is not None:
            s = self._relative_uploads.sub("<UPLOADS>/", s)
        if not self.keep_hex:
            s = HEX32_RE.sub(lambda m: self._auto("TASK", m.group(0)), s)
        s = JWT_RE.sub(lambda m: self._auto("JWT", m.group(0)), s)
        s = UUID_RE.sub(lambda m: self._auto("UUID", m.group(0)), s)
        s = TS_RE.sub("<TIMESTAMP>", s)
        s = TS_DASH_RE.sub("<TIMESTAMP>", s)
        s = COMPACT_TS_RE.sub("<TIMESTAMP>", s)
        s = ERROR_CODE_RE.sub("<ERROR_CODE>", s)
        s = ERROR_KEY_RE.sub("<ERROR_KEY>", s)
        s = ELAPSED_RE.sub("<ELAPSED> elapsed", s)
        s = STATE_RE.sub(r"\1<STATE>", s)
        s = PROJECT_PATH_RE.sub(self._project_path_sub, s)
        return s

    def _project_path_sub(self, m: re.Match) -> str:
        pid = int(m.group(2))
        return m.group(1) + (self.project_ids[pid] if pid in self.project_ids else m.group(2))

    def path(self, path: str) -> str:
        return self.string(path)

    # -- json -----------------------------------------------------------------------------------------
    def value(self, v: Any, key: str | None = None) -> Any:
        if isinstance(v, str):
            return self.string(v)
        if isinstance(v, bool) or v is None:
            return v
        if isinstance(v, int):
            if key in ("projectId", "project_id"):
                return self.project(v)
            if key == "timestamp" and v > 10**11:
                return "<EPOCH_MS>"
            return v
        if isinstance(v, float):
            return v
        if isinstance(v, list):
            return [self.value(x) for x in v]
        if isinstance(v, dict):
            # a project object: has an integer id and a list of versions
            out: dict[str, Any] = {}
            if isinstance(v.get("id"), int) and not isinstance(v.get("id"), bool) and isinstance(v.get("versions"), list):
                out["id"] = self.project(v["id"])
            for k in sorted(v.keys()):
                if k == "id" and "id" in out:
                    continue
                out[self.string(k) if isinstance(k, str) else k] = self.value(v[k], k)
            return out
        return v
