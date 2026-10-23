"""Recording / faulting proxy for hintr + stub ADR (CKAN), stub issue-report ("flow") endpoint and a stub
OAuth2 IdP (TLS).  Pure stdlib so that it can run anywhere.

    python -m hintcontract.stubs.server --proxy-port 18882 --upstream http://127.0.0.1:18881 \
        --stub-port 18883 --idp-port 18884 --idp-cert .run/idp.pem --fixtures-dir fixtures

Proxy (hint -> hintr), set `hintr_url` of the system under test to the proxy URL:
    * forwards everything to --upstream and records method/path/query/body/selected headers/status
    * GET  /__control/calls?clear=1      -> recorded calls
    * POST /__control/reset              -> forget calls and faults
    * POST /__control/faults             -> install fault rules (JSON list)

Stub (ADR/CKAN under /adr/ and /adr-sso/, issue report under /flow):
    * POST /__control/state              -> replace stub state (datasets, releases, ... see StubState)
    * GET  /__control/calls?clear=1      -> recorded calls
    * POST /__control/reset              -> reset state, faults and calls
    * POST /__control/faults             -> fault rules (same format as the proxy)

Fault rule: {"method": "GET"|null, "path_regex": "...", "times": N|null, "action": {...}} where action is one of
    {"type": "status", "status": 500, "json": {...} | "body": "text", "content_type": "..."}
    {"type": "raw", "status": 200, "body": "not json", "content_type": "application/json"}
    {"type": "delay", "seconds": 2}          (then handled normally)
    {"type": "close"}                        (drop the connection without answering)
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import http.client
import json
import re
import socket
import ssl
import sys
import threading
import time
import urllib.parse
from email.parser import BytesParser
from email.policy import HTTP
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

RECORDED_HEADERS = ("accept-language", "content-type", "authorization")
# hintr's JSON answers are kept (in memory, never in a golden) so the tests can check that hint relays them unchanged
MAX_RECORDED_RESPONSE_BYTES = 50_000_000


class _State:
    def __init__(self):
        self.lock = threading.Lock()
        self.calls: list[dict] = []
        self.faults: list[dict] = []
        self.stub_state: dict = {}
        self.epoch = 0          # bumped by reset: delayed requests of an earlier scenario abort instead of answering

    def reset(self):
        with self.lock:
            self.epoch += 1
            self.calls = []
            self.faults = []
            self.stub_state = {}


PROXY = _State()
STUB = _State()
UPSTREAM = {"host": "127.0.0.1", "port": 8888}
FIXTURES_DIR = {"path": Path("fixtures")}


def _find_fault(state: _State, method: str, path: str):
    with state.lock:
        for rule in state.faults:
            if rule.get("method") and rule["method"].upper() != method:
                continue
            if not re.search(rule.get("path_regex", ".*"), path):
                continue
            times = rule.get("times")
            if times is not None:
                if times <= 0:
                    continue
                rule["times"] = times - 1
            return rule["action"]
    return None


def _json_bytes(obj) -> bytes:
    return json.dumps(obj).encode()


class BaseHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    state: _State = PROXY

    def log_message(self, fmt, *args):  # quiet
        pass

    # -- helpers -----------------------------------------------------------------------------------
    def _body(self) -> bytes:
        length = int(self.headers.get("Content-Length") or 0)
        if length:
            return self.rfile.read(length)
        if (self.headers.get("Transfer-Encoding") or "").lower() == "chunked":
            data = b""
            while True:
                size = int(self.rfile.readline().strip() or b"0", 16)
                if size == 0:
                    self.rfile.readline()
                    break
                data += self.rfile.read(size)
                self.rfile.readline()
            return data
        return b""

    def _send(self, status: int, body: bytes = b"", headers: dict | None = None, content_type: str | None = None):
        self.send_response(status)
        headers = dict(headers or {})
        if content_type:
            headers["Content-Type"] = content_type
        for k, v in headers.items():
            self.send_header(k, v)
        if self.command != "HEAD" or "Content-Length" not in headers:
            self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)
        self.close_connection = True

    def _control(self, path: str, query: dict, body: bytes) -> bool:
        if not path.startswith("/__control/"):
            return False
        cmd = path[len("/__control/"):]
        if cmd == "calls":
            with self.state.lock:
                calls = list(self.state.calls)
                if query.get("clear", ["0"])[0] == "1":
                    self.state.calls = []
            self._send(200, _json_bytes(calls), content_type="application/json")
        elif cmd == "reset":
            self.state.reset()
            self._send(200, b"{}", content_type="application/json")
        elif cmd == "faults":
            with self.state.lock:
                self.state.faults = json.loads(body or b"[]")
            self._send(200, b"{}", content_type="application/json")
        elif cmd == "state":
            with self.state.lock:
                self.state.stub_state = json.loads(body or b"{}")
            self._send(200, b"{}", content_type="application/json")
        elif cmd == "ping":
            self._send(200, b"{}", content_type="application/json")
        else:
            self._send(404, b"{}", content_type="application/json")
        return True

    def _apply_fault(self, action: dict) -> bool:
        """Returns True if the request was fully handled."""
        t = action["type"]
        if t == "close":
            try:
                self.connection.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            self.close_connection = True
            return True
        if t == "delay":
            epoch = self.state.epoch
            deadline = time.time() + action["seconds"]
            while time.time() < deadline:
                time.sleep(0.2)
                if self.state.epoch != epoch:      # a new scenario started: drop this stale request silently
                    self.close_connection = True
                    try:
                        self.connection.shutdown(socket.SHUT_RDWR)
                    except OSError:
                        pass
                    with self.state.lock:
                        self.state.aborted = getattr(self.state, "aborted", 0) + 1
                    return True
            return False
        if t in ("status", "raw"):
            if "json" in action:
                body = _json_bytes(action["json"])
                ctype = action.get("content_type", "application/json")
            else:
                body = action.get("body", "").encode()
                ctype = action.get("content_type", "application/json" if t == "raw" else "text/plain")
            self._send(action.get("status", 200), body, content_type=ctype)
            return True
        raise ValueError(f"unknown fault action {t}")

    def do_GET(self): self.handle_any()
    def do_POST(self): self.handle_any()
    def do_PUT(self): self.handle_any()
    def do_DELETE(self): self.handle_any()
    def do_HEAD(self): self.handle_any()
    def do_PATCH(self): self.handle_any()

    def handle_any(self):  # pragma: no cover - overridden
        raise NotImplementedError


class ProxyHandler(BaseHandler):
    state = PROXY

    def handle_any(self):
        parsed = urllib.parse.urlsplit(self.path)
        body = self._body()
        if self._control(parsed.path, urllib.parse.parse_qs(parsed.query), body):
            return
        call = {
            "method": self.command,
            "path": parsed.path,
            "query": parsed.query,
            "headers": {k: self.headers[k] for k in self.headers.keys() if k.lower() in RECORDED_HEADERS},
            "body": body.decode("utf-8", "replace") if body else None,
            "ignored": parsed.path == "/wake",
        }
        action = _find_fault(self.state, self.command, parsed.path)
        if action:
            call["fault"] = action["type"]
            with self.state.lock:
                self.state.calls.append(call)
            if self._apply_fault(action):
                return
        conn = http.client.HTTPConnection(UPSTREAM["host"], UPSTREAM["port"], timeout=600)
        try:
            fwd = {k: v for k, v in self.headers.items()
                   if k.lower() not in ("host", "connection", "content-length", "transfer-encoding", "accept-encoding")}
            conn.request(self.command, self.path, body=body or None, headers=fwd)
            resp = conn.getresponse()
            data = resp.read()
            call["status"] = resp.status
            if "json" in (resp.getheader("Content-Type") or "").lower() and len(data) <= MAX_RECORDED_RESPONSE_BYTES:
                call["response_body"] = data.decode("utf-8", "replace")
            hdrs = {}
            for k, v in resp.getheaders():
                if k.lower() in ("content-type", "content-disposition"):
                    hdrs[k] = v
            if self.command == "HEAD":
                hdrs["Content-Length"] = resp.getheader("Content-Length") or "0"
            with self.state.lock:
                self.state.calls.append(call)
            self._send(resp.status, data, headers=hdrs)
        except Exception as e:  # upstream down
            call["status"] = None
            call["error"] = repr(e)
            with self.state.lock:
                self.state.calls.append(call)
            self._send(502, _json_bytes({"error": "proxy upstream failure"}), content_type="application/json")
        finally:
            conn.close()


def parse_multipart(content_type: str, body: bytes) -> dict:
    """Returns {"fields": {name: value}, "files": {name: {"filename", "sha256", "size"}}}"""
    msg = BytesParser(policy=HTTP).parsebytes(b"Content-Type: " + content_type.encode() + b"\r\n\r\n" + body)
    fields, files = {}, {}
    if msg.is_multipart():
        for part in msg.iter_parts():
            name = part.get_param("name", header="content-disposition")
            filename = part.get_filename()
            payload = part.get_payload(decode=True) or b""
            if filename is not None:
                files[name] = {"filename": filename, "sha256": hashlib.sha256(payload).hexdigest(),
                               "md5": hashlib.md5(payload).hexdigest(), "size": len(payload)}
            else:
                fields[name] = payload.decode("utf-8", "replace")
    return {"fields": fields, "files": files}


def ckan_ok(result):
    return 200, {"success": True, "result": result}


def ckan_err(message, status=404, etype="Not Found Error"):
    return status, {"success": False, "error": {"message": message, "__type": etype}}


class StubHandler(BaseHandler):
    state = STUB

    def handle_any(self):
        parsed = urllib.parse.urlsplit(self.path)
        query = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)
        body = self._body()
        if self._control(parsed.path, query, body):
            return
        ctype = self.headers.get("Content-Type", "")
        call = {
            "method": self.command,
            "path": parsed.path,
            "query": {k: (v[0] if len(v) == 1 else v) for k, v in query.items()},
            "headers": {k: self.headers[k] for k in self.headers.keys() if k.lower() in ("authorization", "content-type")},
        }
        if "multipart/form-data" in ctype:
            call["multipart"] = parse_multipart(ctype, body)
            call["headers"].pop("Content-Type", None)
        elif "application/x-www-form-urlencoded" in ctype:
            call["form"] = {k: v[0] for k, v in urllib.parse.parse_qs(body.decode(), keep_blank_values=True).items()}
            call["headers"].pop("Content-Type", None)
        elif body:
            try:
                call["json"] = json.loads(body)
            except ValueError:
                call["body"] = body.decode("utf-8", "replace")
            call["headers"].pop("Content-Type", None)
        else:
            call["headers"].pop("Content-Type", None)
        with self.state.lock:
            self.state.calls.append(call)
        action = _find_fault(self.state, self.command, parsed.path)
        if action and self._apply_fault(action):
            return
        try:
            self._route(parsed.path, call, query)
        except Exception as e:  # stub bug: make it loud
            self._send(599, _json_bytes({"stub_error": repr(e)}), content_type="application/json")

    # ------------------------------------------------------------------------------------------------
    def _reply(self, status_body):
        status, obj = status_body
        self._send(status, _json_bytes(obj), content_type="application/json;charset=utf-8")

    def _route(self, path: str, call: dict, query: dict):
        st = self.state.stub_state
        if path == "/flow":
            fl = st.get("flow", {})
            status = fl.get("status", 200)
            self._send(status, _json_bytes(fl.get("body", {"statusCode": 200, "description": "OK"})),
                       content_type="application/json")
            return
        m = re.match(r"^/(adr|adr-sso)/api/3/action/(\w+)$", path)
        if m:
            self._ckan(m.group(2), call, query, st)
            return
        m = re.match(r"^/(adr|adr-sso)/(dataset/.*)$", path)
        if m:  # resource download
            files = st.get("files", {})
            f = files.get("/" + m.group(2))
            if f is None:
                self._send(404, b"not found", content_type="text/plain")
                return
            if "redirect" in f:
                self._send(f.get("status", 302), b"", headers={"Location": f["redirect"]})
                return
            if "fixture" in f:
                data = (FIXTURES_DIR["path"] / f["fixture"]).read_bytes()
            elif "b64" in f:
                data = base64.b64decode(f["b64"])
            else:
                data = f.get("text", "").encode()
            self._send(f.get("status", 200), data, content_type=f.get("content_type", "application/octet-stream"))
            return
        if path.endswith("/login-page"):
            self._send(200, b"<html><title>login</title></html>", content_type="text/html")
            return
        self._send(404, b"{}", content_type="application/json")

    def _ckan(self, action: str, call: dict, query: dict, st: dict):
        q = {k: v[0] for k, v in query.items()}
        form = call.get("form") or {}
        mp = (call.get("multipart") or {}).get("fields", {})
        datasets = st.get("datasets", [])
        if action == "package_search":
            qs = q.get("q", "")
            types = re.findall(r"type:\(([^)]*)\)", qs)
            allowed = set(re.split(r"\s+OR\s+", types[0])) if types else None
            res = [d for d in datasets if allowed is None or d.get("type") in allowed]
            self._reply(ckan_ok({"count": len(res), "results": res}))
        elif action == "package_show":
            key = q.get("id")
            if q.get("release") and f"{key}@{q['release']}" in st.get("release_datasets", {}):
                self._reply(ckan_ok(st["release_datasets"][f"{key}@{q['release']}"]))
                return
            found = [d for d in datasets if d.get("id") == key or d.get("name") == key]
            self._reply(ckan_ok(found[0]) if found else ckan_err("Not found"))
        elif action == "dataset_version_list":
            rel = st.get("releases", {}).get(q.get("dataset_id"))
            self._reply(ckan_ok(rel) if rel is not None else ckan_ok([]))
        elif action == "organization_list_for_user":
            self._reply(ckan_ok(st.get("orgs", [])))
        elif action == "package_activity_list":
            self._reply(ckan_ok(st.get("activity", {}).get(q.get("id"), [])))
        elif action == "version_delete":
            self._reply(ckan_ok(None))
        elif action == "dataset_version_create":
            self._reply(ckan_ok({"id": "new-release-id", "name": form.get("name"), "dataset_id": form.get("dataset_id")}))
        elif action in ("resource_create", "resource_patch"):
            rtype = mp.get("resource_type")
            output = rtype in ("inputs-unaids-naomi-output-zip", "inputs-unaids-naomi-report",
                               "inputs-unaids-naomi-comparison-report")
            # outputs differ per session (zip/html built by hintr): do not echo their digest
            self._reply(ckan_ok({"id": mp.get("id", "new-resource-id"), "name": mp.get("name"),
                                 "resource_type": rtype, "hash": None if output else mp.get("hash")}))
        elif action == "resource_show":
            res = st.get("resources", {}).get(q.get("id"))
            self._reply(ckan_ok(res) if res else ckan_err("Not found"))
        else:
            self._reply(ckan_err(f"Action {action} not supported by stub", 400, "Validation Error"))


def idp_handler_factory():
    class IdpHandler(BaseHandler):
        state = STUB

        def handle_any(self):
            parsed = urllib.parse.urlsplit(self.path)
            body = self._body()
            call = {"method": self.command, "path": parsed.path, "query": parsed.query,
                    "form": {k: v[0] for k, v in urllib.parse.parse_qs(body.decode()).items()} if body else None,
                    "idp": True}
            with self.state.lock:
                self.state.calls.append(call)
            idp = self.state.stub_state.get("idp", {})
            if parsed.path == "/oauth/token":
                self._send(idp.get("token_status", 200),
                           _json_bytes(idp.get("token", {"access_token": "stub-access-token", "token_type": "Bearer",
                                                          "expires_in": 3600, "scope": "openid profile email"})),
                           content_type="application/json")
            elif parsed.path == "/userinfo":
                self._send(idp.get("userinfo_status", 200),
                           _json_bytes(idp.get("userinfo", {"email": "sso.user@example.com"})),
                           content_type="application/json")
            else:
                self._send(404, b"{}", content_type="application/json")
    return IdpHandler


class _Server(ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 128
    allow_reuse_address = True


def serve(handler, port, tls: str | None = None, name: str = ""):
    srv = _Server(("127.0.0.1", port), handler)
    if tls:
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(tls)
        srv.socket = ctx.wrap_socket(srv.socket, server_side=True)
    t = threading.Thread(target=srv.serve_forever, name=name, daemon=True)
    t.start()
    return srv


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--proxy-port", type=int, default=18882)
    ap.add_argument("--upstream", default="http://127.0.0.1:18881")
    ap.add_argument("--stub-port", type=int, default=18883)
    ap.add_argument("--idp-port", type=int, default=18884)
    ap.add_argument("--idp-cert", default=None, help="PEM with cert+key for the TLS IdP stub")
    ap.add_argument("--fixtures-dir", default="fixtures")
    args = ap.parse_args(argv)
    u = urllib.parse.urlsplit(args.upstream)
    UPSTREAM.update(host=u.hostname, port=u.port or 80)
    FIXTURES_DIR["path"] = Path(args.fixtures_dir)
    serve(ProxyHandler, args.proxy_port, name="proxy")
    serve(StubHandler, args.stub_port, name="stub")
    if args.idp_cert:
        serve(idp_handler_factory(), args.idp_port, tls=args.idp_cert, name="idp")
    print(f"proxy :{args.proxy_port} -> {args.upstream}; stub :{args.stub_port}; idp :{args.idp_port if args.idp_cert else '-'}",
          flush=True)
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
