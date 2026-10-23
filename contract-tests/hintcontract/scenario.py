"""Scenario = a multi-step session recorded to / compared against a golden file.

Every request issued through a `RecordedClient` becomes a step.  In record mode (`--record`) the normalised steps are
written to goldens/<module>/<test>.json; otherwise each step is compared with the golden as it happens, so that a
failure points at the exact step.
"""
from __future__ import annotations

import hashlib
import json
import re
import time
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

import httpx

from . import bodies
from .compare import diff, sort_lists_at
from .controls import ControlApi, Db
from .env import Env
from .http import Client, Response
from .normalize import Normalizer

REQUEST_HEADERS = {"accept-language", "accept", "authorization", "accept-encoding"}
RESPONSE_HEADERS = {"content-type", "location", "content-disposition", "content-encoding", "www-authenticate",
                    "allow"}


@dataclass
class Upload:
    filename: str
    content: bytes
    content_type: str = "application/octet-stream"
    fixture: str | None = None
    volatile: bool = False      # content differs between runs (e.g. embeds task ids): digest/size not recorded


class ScenarioFailure(AssertionError):
    pass


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


class Scenario:
    def __init__(self, env: Env, name: str, golden_path: Path, db: Db | None, proxy: ControlApi | None,
                 stub: ControlApi | None):
        self.env = env
        self.name = name
        self.golden_path = golden_path
        self.db = db
        self.proxy = proxy
        self.stub = stub
        self.norm = Normalizer(env)
        self.steps: list[dict] = []
        self.record = env.record
        self.expected: list[dict] | None = None
        self._clients: dict[str, RecordedClient] = {}
        self._quiet = 0
        self._last_response_hdrs: dict = {}
        self.last_hintr_bodies: list[str] = []   # raw JSON answers of the hintr calls drained last (never recorded)
        if not self.record:
            if not golden_path.exists():
                raise ScenarioFailure(
                    f"no golden for {name} at {golden_path}; run with --record against the Kotlin app")
            self.expected = self._applicable(json.loads(golden_path.read_text())["steps"])

    def _applicable(self, steps: list[dict]) -> list[dict]:
        """Drop golden parts that need side channels this run does not have (db / uploads / outbound capture)."""
        out = []
        for s in steps:
            if s.get("type") == "db" and not self.db:
                continue
            if s.get("type") == "uploads" and not self.env.uploads_dir:
                continue
            s = dict(s)
            if "outbound" in s:
                calls = s["outbound"]
                kept = [c for c in calls if (c["to"] == "hintr" and self.proxy) or (c["to"] != "hintr" and self.stub)]
                if kept:
                    s["outbound"] = kept
                else:
                    del s["outbound"]
            out.append(s)
        return out

    # -- environment preparation ---------------------------------------------------------------------------
    def prepare(self):
        """Reset all state the SUT keeps (db rows, uploads, emails, stub/proxy state)."""
        from .fsutil import clean_dir
        if self.db:
            self.db.reset()
        if self.env.uploads_dir:
            clean_dir(self.env.uploads_dir)
        clean_dir(self.env.emails_dir)
        if self.proxy:
            self.proxy.reset()
        if self.stub:
            self.stub.reset()

    # -- clients ---------------------------------------------------------------------------------------------
    def client(self, name: str = "A", base_url: str | None = None) -> "RecordedClient":
        key = f"{name}@{base_url or ''}"
        if key not in self._clients:
            self._clients[key] = RecordedClient(self, name, Client(base_url or self.env.base_url, name))
        return self._clients[key]

    def close(self):
        for c in self._clients.values():
            c.raw.close()

    @contextmanager
    def quiet(self):
        """Requests issued inside are executed but not recorded / compared (setup noise)."""
        self._quiet += 1
        try:
            yield
        finally:
            self._quiet -= 1

    def bind_task(self, real_id: str, label: str) -> str:
        return self.norm.bind("TASK", real_id, label)

    # -- step bookkeeping ------------------------------------------------------------------------------------
    def add_step(self, step: dict):
        if self._quiet:
            return
        idx = len(self.steps)
        self.steps.append(step)
        if self.record or self.expected is None:
            return
        if idx >= len(self.expected):
            raise ScenarioFailure(f"[{self.name}] step {idx + 1} ({step.get('name')}) is not in the golden "
                                  f"(golden has {len(self.expected)} steps)")
        exp = self.expected[idx]
        d = diff(exp, step, "$")
        if d:
            self.dump_artifacts()
            head = f"[{self.name}] step {idx + 1} '{step.get('name')}' differs from golden:\n  " + "\n  ".join(d)
            raise ScenarioFailure(head)

    def dump_artifacts(self):
        self.env.artifacts_dir.mkdir(parents=True, exist_ok=True)
        out = self.env.artifacts_dir / (re.sub(r"[^A-Za-z0-9_.-]+", "_", self.name) + ".actual.json")
        out.write_text(json.dumps({"scenario": self.name, "steps": self.steps}, indent=2, sort_keys=True,
                                  ensure_ascii=False))

    def finish(self, passed: bool = True):
        if not passed:
            self.dump_artifacts()
            return
        if self.record:
            self.golden_path.parent.mkdir(parents=True, exist_ok=True)
            doc = {"scenario": self.name, "steps": self.steps}
            self.golden_path.write_text(json.dumps(doc, indent=2, sort_keys=True, ensure_ascii=False) + "\n")
        elif self.expected is not None and len(self.steps) != len(self.expected):
            self.dump_artifacts()
            raise ScenarioFailure(f"[{self.name}] golden has {len(self.expected)} steps but the test produced "
                                  f"{len(self.steps)}")

    # -- side-effect observation ----------------------------------------------------------------------------
    def db_rows(self, table: str, name: str | None = None) -> list[dict]:
        """Snapshot of a Postgres table (needs --db-url)."""
        if not self.db:
            return []
        raw = self.db.table(table)
        rows = []
        for r in raw:
            r = dict(r)
            if table == "project":
                r["id"] = self.norm.project(r["id"])
            if table == "project_version" and r.get("project_id") is not None:
                r["project_id"] = self.norm.project(r["project_id"])
            if table == "project_version" and r.get("state") is not None:
                try:
                    r["state"] = json.loads(r["state"])
                except ValueError:
                    pass
            rows.append(r)
        rows = [self.norm.value(r) for r in rows]
        # `state` JSON blobs are normalised like response bodies
        self.add_step({"type": "db", "name": name or f"db:{table}", "table": table, "rows": bodies.maybe_large(rows)})
        return raw

    def uploads(self, name: str | None = None) -> list[str]:
        """Snapshot of the uploads directory: names must be `<UPPERCASE MD5 OF CONTENT>.<extension>`."""
        if not self.env.uploads_dir:
            return []
        files = []
        d = self.env.uploads_dir
        for p in sorted(d.iterdir()) if d.exists() else []:
            if not p.is_file():
                continue
            data = p.read_bytes()
            stem = p.name.split(".")[0] if "." in p.name else p.name
            files.append({"name": p.name, "size": len(data),
                          "name_matches_md5": hashlib.md5(data).hexdigest().upper() == stem})
        self.add_step({"type": "uploads", "name": name or "uploads", "files": files})
        return [f["name"] for f in files]

    def emails(self, name: str | None = None, quiet: bool = False) -> list[str]:
        """Emails written by the email_mode=disk manager.  Returns raw texts, records normalised ones."""
        texts = []
        d = self.env.emails_dir
        for p in sorted(d.iterdir()) if d.exists() else []:
            if p.is_file():
                texts.append(p.read_text())
        if not quiet:
            self.add_step({"type": "emails", "name": name or "emails", "emails": [self.norm.string(t) for t in texts]})
        return texts

    def last_email_token(self) -> str:
        """Token in the most recent reset-password email."""
        texts = self.emails(quiet=True)
        assert texts, "no email was written"
        m = re.search(r"token=([^\s]+)", texts[-1])
        assert m, texts[-1]
        return m.group(1)

    def set_stub(self, **state):
        assert self.stub, "no --stub-control-url configured"
        self.stub.set_state(state)

    def set_faults(self, target: str, faults: list[dict]):
        api = {"hintr": self.proxy, "stub": self.stub}[target]
        assert api, f"no control url configured for {target}"
        api.set_faults(faults)

    # -- outbound capture --------------------------------------------------------------------------------------
    def drain_outbound(self) -> list[dict]:
        calls = []
        self.last_hintr_bodies = []
        if self.proxy:
            for c in self.proxy.calls(clear=True):
                if c.get("ignored"):
                    continue
                if c.get("response_body") is not None:
                    self.last_hintr_bodies.append(c["response_body"])
                calls.append(self._norm_proxy_call(c))
        if self.stub:
            for c in self.stub.calls(clear=True):
                calls.append(self._norm_stub_call(c))
        return calls

    def _norm_proxy_call(self, c: dict) -> dict:
        out: dict[str, Any] = {"to": "hintr", "method": c["method"], "path": self.norm.path(c["path"])}
        if c.get("query"):
            out["query"] = self.norm.string(c["query"])
        hdrs = {k.lower(): v for k, v in (c.get("headers") or {}).items() if k.lower() == "accept-language"}
        if hdrs:
            out["headers"] = hdrs
        if c.get("body"):
            try:
                out["json"] = bodies.maybe_large(self.norm.value(json.loads(c["body"])))
            except ValueError:
                out["body"] = self.norm.string(c["body"])
        if c.get("fault"):
            out["fault"] = c["fault"]
        out["status"] = c.get("status")
        return out

    def _norm_stub_call(self, c: dict) -> dict:
        self.norm.keep_hex = True
        try:
            return self._norm_stub_call_inner(c)
        finally:
            self.norm.keep_hex = False

    def _norm_stub_call_inner(self, c: dict) -> dict:
        if c.get("idp"):
            out = {"to": "idp", "method": c["method"], "path": c["path"]}
            if c.get("form"):
                out["form"] = {k: (self.norm.string(v) if k != "code" else v) for k, v in sorted(c["form"].items())}
            return out
        path = c["path"]
        for prefix, token in (("/adr-sso", "<ADR_SSO>"), ("/adr", "<ADR>")):
            if path.startswith(prefix + "/"):
                path = path[len(prefix):]
                to = "adr-sso" if token == "<ADR_SSO>" else "adr"
                break
        else:
            to = "stub"
        out = {"to": to, "method": c["method"], "path": self.norm.string(path)}
        if c.get("query"):
            out["query"] = {k: self.norm.value(v) for k, v in sorted(c["query"].items())}
        hdr = {k.lower(): self.norm.string(v) for k, v in (c.get("headers") or {}).items() if k.lower() == "authorization"}
        if hdr:
            out["headers"] = hdr
        for k in ("form", "json", "body"):
            if c.get(k) is not None:
                out[k] = self.norm.value(c[k])
        if c.get("multipart"):
            mp = c["multipart"]
            # output files (zip/html built by hintr at run time) differ in every session: mask their digests
            masked = mp["fields"].get("resource_type", "") in ("inputs-unaids-naomi-output-zip",
                                                              "inputs-unaids-naomi-report",
                                                              "inputs-unaids-naomi-comparison-report")
            fields = {k: ("<MD5>" if masked and k == "hash" else self.norm.string(v)) for k, v in sorted(mp["fields"].items())}
            files = {k: {"filename": v["filename"], "md5": "<MD5>" if masked else v["md5"],
                         "size": "<SIZE>" if masked else v["size"]} for k, v in sorted(mp["files"].items())}
            out["multipart"] = {"fields": fields, "files": files}
        return out


class RecordedClient:
    def __init__(self, scn: Scenario, name: str, raw: Client):
        self.scn = scn
        self.name = name
        self.raw = raw

    # -- convenience verbs ------------------------------------------------------------------------------------
    def get(self, path, **kw): return self.request("GET", path, **kw)
    def post(self, path, **kw): return self.request("POST", path, **kw)
    def delete(self, path, **kw): return self.request("DELETE", path, **kw)
    def put(self, path, **kw): return self.request("PUT", path, **kw)

    def login(self, username="test.user@example.com", password="password", **kw) -> Response:
        return self.post("/callback/formClient", form={"username": username, "password": password},
                         name=kw.pop("name", f"login {username}"), **kw)

    def open_app(self, path="/", **kw) -> Response:
        """GET / : creates the session's version row (needed before any upload)."""
        return self.get(path, name=kw.pop("name", f"open {path}"), **kw)

    # -- the work ------------------------------------------------------------------------------------------------
    def request(self, method: str, path: str, *, name: str | None = None, params: dict | None = None,
                headers: dict | None = None, json: Any = None, form: dict | None = None,
                files: dict | None = None, raw_body: bytes | None = None, content_type: str | None = None,
                html_checks: list[str] | None = None, unordered: list[str] | None = None,
                binary: str | None = None, ignore_body: bool = False, bind_task: str | None = None, check_cookie: bool = False, no_cookie: bool = False,
                outbound_unordered: bool = False, skip_outbound: bool = False, step_extra: dict | None = None, record: bool = True,
                _poll: dict | None = None, _prepared: Response | None = None) -> Response:
        scn = self.scn
        uploads: dict[str, Upload] = {}
        multipart = None
        if files:
            multipart = {}
            for field, spec in files.items():
                up = self._resolve_upload(spec)
                uploads[field] = up
                multipart[field] = (up.filename, up.content, up.content_type)
        hdrs = dict(headers or {})
        if content_type:
            hdrs["Content-Type"] = content_type
        if scn._quiet == 0 and (scn.proxy or scn.stub) and _prepared is None:
            scn.drain_outbound()
        if _prepared is None:
            resp = self.raw.send(method, path, params=params, headers=hdrs, json=json, data=form, files=multipart,
                                 content=raw_body)
        else:
            resp = _prepared
        if bind_task and resp.status == 200:
            scn.bind_task(resp.json()["data"]["id"], bind_task)
        if scn._quiet:
            return resp
        step = self._build_step(method, path, name, params, hdrs, json, form, uploads, raw_body, resp, html_checks,
                                unordered, binary)
        if ignore_body:
            step['response']['body'] = {'ignored': True, 'non_empty': len(resp.content) > 0}
        if check_cookie:
            assert self.raw.has_session_cookie, f"expected a session cookie to be set after {method} {path}"
            step["session_cookie"] = "set"
        if no_cookie:
            assert not self.raw.has_session_cookie, f"expected no session cookie after {method} {path}"
            step["session_cookie"] = "absent"
        if _poll:
            step["poll"] = _poll
        if scn.proxy or scn.stub:
            calls = scn.drain_outbound()
            if not ignore_body and self._relays_hintr_answer(resp, scn.last_hintr_bodies):
                # hint passed hintr's answer through: hintr (not hint) owns its content, so do not record it
                step["response"]["body"] = {"same_as_upstream": "hintr"}
            if outbound_unordered:
                calls.sort(key=bodies.canonical)
            if calls and not skip_outbound:
                step["outbound"] = calls
        if step_extra:
            step.update(step_extra)
        scn.add_step(step)
        resp.step = step  # type: ignore[attr-defined]
        return resp

    def poll(self, path: str, until: Callable[[Response], bool], until_desc: str, *, timeout: float = 120.0,
             interval: float = 0.4, method: str = "GET", **kw) -> Response:
        """Repeat a request until `until(response)`; only the final response is recorded (polling loops vary in
        length between runs)."""
        deadline = time.time() + timeout
        n = 0
        while True:
            resp = self.raw.send(method, path, headers=kw.get("headers"), params=kw.get("params"))
            n += 1
            if until(resp):
                break
            if time.time() > deadline:
                raise ScenarioFailure(f"poll of {method} {path} did not satisfy '{until_desc}' within {timeout}s;"
                                      f" last: {resp.status} {resp.text[:300]}")
            time.sleep(interval)
        if self.scn.proxy or self.scn.stub:
            self.scn.drain_outbound()
        return self.request(method, path, _prepared=None, _poll={"until": until_desc}, **kw)

    # -- helpers -----------------------------------------------------------------------------------------------------
    @staticmethod
    def _relays_hintr_answer(resp: Response, upstream_bodies: list[str]) -> bool:
        """True when hint's JSON body is exactly (as parsed JSON) the answer of one of the hintr calls it made."""
        if not upstream_bodies or not resp.content:
            return False
        try:
            mine = json_loads(resp.content)
        except ValueError:
            return False
        for raw in upstream_bodies:
            try:
                if json_loads(raw.encode("utf-8")) == mine:
                    return True
            except ValueError:
                continue
        return False

    def _resolve_upload(self, spec) -> Upload:
        if isinstance(spec, Upload):
            return spec
        if isinstance(spec, str):  # fixture name
            p = self.scn.env.fixtures_dir / spec
            return Upload(spec, p.read_bytes(), "application/octet-stream", fixture=spec)
        if isinstance(spec, tuple):
            fn, data = spec[0], spec[1]
            return Upload(fn, data if isinstance(data, bytes) else data.encode())
        raise TypeError(spec)

    def _build_step(self, method, path, name, params, hdrs, json_body, form, uploads, raw_body, resp,
                    html_checks, unordered, binary) -> dict:
        norm = self.scn.norm
        req: dict[str, Any] = {"method": method, "path": norm.path(path)}
        if params:
            req["query"] = {k: ("<STATE>" if k == "state" and isinstance(v, str) and len(v) >= 16   # OAuth2 state
                                 else norm.value(v)) if not isinstance(v, (list, tuple)) else [norm.value(x) for x in v]
                            for k, v in sorted(params.items())}
        rh = {k.lower(): v for k, v in hdrs.items() if k.lower() in REQUEST_HEADERS}
        if "authorization" in rh:
            rh["authorization"] = re.sub(r"^(Bearer|Basic) .*", r"\1 <TOKEN>", rh["authorization"])
        if rh:
            req["headers"] = rh
        body: dict[str, Any] | None = None
        if json_body is not None:
            body = {"json": bodies.maybe_large(norm.value(json_body))}
        elif uploads:
            body = {"multipart": {f: ({"filename": u.filename, "volatile_content": True} if u.volatile else
                                      {"filename": u.filename, "size": len(u.content), "sha256": sha256(u.content),
                                       **({"fixture": u.fixture} if u.fixture else {})})
                                  for f, u in sorted(uploads.items())}}
            if form:
                body["multipart_fields"] = {k: norm.value(v) for k, v in sorted(form.items())}
        elif form is not None:
            body = {"form": {k: (norm.value(v) if not isinstance(v, list) else [norm.value(x) for x in v])
                             for k, v in sorted(form.items())}}
        elif raw_body is not None:
            body = {"raw": {"size": len(raw_body), "sha256": sha256(raw_body),
                            "content_type": hdrs.get("Content-Type")}}
        if body:
            req["body"] = body
        hdr_out = {}
        for k, v in resp.headers.items():
            lk = k.lower()
            if lk not in RESPONSE_HEADERS:
                continue
            if lk == "content-type":
                v = bodies.scrub_media_type(v)
            elif lk == "content-encoding" and "gzip" not in hdrs.get("Accept-Encoding", ""):
                continue
            hdr_out[lk] = norm.string(v)
        out_resp: dict[str, Any] = {"status": resp.status}
        if hdr_out:
            out_resp["headers"] = hdr_out
        out_resp["body"] = self._body(resp, html_checks, unordered, binary)
        return {"name": name or norm.path(f"{method} {path}"), "client": self.name, "request": req, "response": out_resp}

    def _body(self, resp: Response, html_checks, unordered, binary) -> dict:
        norm = self.scn.norm
        ct = bodies.scrub_media_type(resp.content_type)
        content = resp.content
        if not content:
            return {"empty": True}
        if ct == "application/json" or (ct == "" and content[:1] in (b"{", b"[")):
            try:
                val = json_loads(content)
            except ValueError:
                return {"text": norm.string(resp.text[:2000]), "invalid_json": True}
            val = norm.value(val)
            val = sort_lists_at(val, unordered)
            return {"json": bodies.maybe_large(val)}
        if ct == "text/html":
            for needle in html_checks or []:
                assert needle in resp.text, f"expected html to contain {needle!r}"
            out = {"html": True}
            m = re.search(r"<title>(.*?)</title>", resp.text, re.S)
            if m:
                out["title"] = m.group(1).strip()
            if html_checks:
                out["contains"] = [norm.string(h) for h in html_checks]
            return out
        if ct.startswith("text/") or ct in ("application/javascript",):
            text = resp.text
            if len(text) > 20000:
                return {"text_sha256": sha256(content), "size": len(content)}
            return {"text": norm.string(text)}
        return {"binary": bodies.binary_summary(content, binary)}


def json_loads(content: bytes):
    return json.loads(content)
