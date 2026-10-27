#!/usr/bin/env python3
"""Generate the endpoint x scenario matrix of COVERAGE.md from the goldens.

    scripts/gen-coverage.py > COVERAGE.md

Every golden step records the request (method, normalised path) and the response status/error, so the matrix is
computed, not hand-maintained: an endpoint is "covered" by every test whose golden contains a matching request.
The 'Uncovered and why' section is the static text in UNCOVERED below.
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GOLDENS = ROOT / "goldens"

# (group, method, path template)  -- the endpoint index of docs/endpoint-flows.md plus the pac4j endpoints
ENDPOINTS = [
    ("pages", "GET", "/"), ("pages", "GET", "/projects"), ("pages", "GET", "/accessibility"), ("pages", "GET", "/privacy"),
    ("auth", "GET", "/login"), ("auth", "GET", "/oauth2"), ("auth", "GET", "/register"), ("auth", "GET", "/sso"),
    ("auth", "POST", "/callback/formClient"), ("auth", "GET", "/callback/oauth2Client"), ("auth", "GET", "/logout"),
    ("auth", "GET", "/password/forgot-password"), ("auth", "POST", "/password/request-reset-link"),
    ("auth", "GET", "/password/reset-password"), ("auth", "POST", "/password/reset-password"),
    ("users", "GET", "/user/{email}/exists"), ("monitoring", "GET", "/metrics"),
    ("projects", "GET", "/projects/"), ("projects", "GET", "/project/current"), ("projects", "POST", "/project"),
    ("projects", "POST", "/project/{id}/rename"), ("projects", "POST", "/project/{id}/note"),
    ("projects", "POST", "/project/{id}/clone"), ("projects", "DELETE", "/project/{id}"),
    ("versions", "POST", "/project/{id}/version"), ("versions", "POST", "/project/{id}/version/{v}/state"),
    ("versions", "POST", "/project/{id}/version/{v}/promote"), ("versions", "POST", "/project/{id}/version/{v}/note"),
    ("versions", "POST", "/guest/version"), ("versions", "GET", "/project/{id}/version/{v}"), ("versions", "DELETE", "/project/{id}/version/{v}"),
    ("session", "POST", "/session/files/"),
    *[("baseline", m, f"/baseline/{t}/") for t in ("pjnz", "shape", "population") for m in ("POST", "GET", "DELETE")],
    ("baseline", "GET", "/baseline/validate/"),
    *[("disease", m, f"/disease/{t}/") for t in ("survey", "programme", "anc", "vmmc") for m in ("POST", "GET", "DELETE")],
    ("chart-data", "GET", "/chart-data/input-time-series/{type}"), ("chart-data", "GET", "/chart-data/input-comparison"),
    ("chart-data", "GET", "/chart-data/input-population"), ("chart-data", "POST", "/meta/review-inputs/{iso3}"),
    ("meta", "GET", "/meta/hintr/version"),
    ("model", "GET", "/model/options/"), ("model", "POST", "/model/validate/options/"), ("model", "POST", "/model/run/"),
    ("model", "GET", "/model/status/{id}"), ("model", "GET", "/model/result/{id}"), ("model", "POST", "/model/cancel/{id}"),
    ("model", "GET", "/model/comparison/plot/{id}"), ("model", "GET", "/model/debug/{id}"),
    ("calibrate", "GET", "/calibrate/options/{iso3}"), ("calibrate", "POST", "/calibrate/submit/{id}"),
    ("calibrate", "GET", "/calibrate/status/{id}"), ("calibrate", "GET", "/calibrate/result/metadata/{id}"),
    ("calibrate", "GET", "/calibrate/plot/{id}"), ("calibrate", "POST", "/calibrate/result/filteredData/{id}"),
    ("calibrate", "GET", "/calibrate/result/data/{id}/{indicator}"),
    ("download", "POST", "/download/submit/{type}/{id}"), ("download", "GET", "/download/status/{id}"),
    ("download", "GET", "/download/result/{id}"), ("download", "GET", "/meta/adr/{id}"),
    ("rehydrate", "POST", "/rehydrate/zip"), ("rehydrate", "POST", "/rehydrate/adr"),
    ("adr", "GET", "/adr/key"), ("adr", "POST", "/adr/key"), ("adr", "DELETE", "/adr/key"), ("adr", "GET", "/adr/schemas"),
    ("adr", "GET", "/adr/datasets"), ("adr", "GET", "/adr/datasets/{id}"), ("adr", "GET", "/adr/datasets/{id}/releases"),
    ("adr", "GET", "/adr/orgs"),
    *[("adr", "POST", f"/adr/{t}") for t in ("pjnz", "shape", "population", "survey", "programme", "anc", "vmmc", "output")],
    ("adr-push", "POST", "/adr/datasets/{id}/releases"),
    ("adr-push", "POST", "/adr/datasets/{id}/resource/{resourceType}/{downloadId}"),
    ("error-report", "POST", "/error-report"),
]


def pattern(template: str, loose: bool) -> re.Pattern:
    base = template.rstrip("/") or "/" if loose else template
    parts = re.split(r"(\{[^}]+\})", base)
    rx = "".join("[^/]+" if p.startswith("{") else re.escape(p) for p in parts)
    return re.compile("^" + rx + ("/?$" if loose else "$"))


COMPILED = [(g, m, t, pattern(t, False), pattern(t, True)) for g, m, t in ENDPOINTS]


def match(method: str, path: str):
    path = path.split("?")[0]
    # exact template first (trailing slash matters: /projects is the page, /projects/ the list), then loose;
    # most specific template first (fewest placeholders, longest literal)
    for idx in (3, 4):
        cands = [(c[0], c[1], c[2]) for c in COMPILED if c[1] == method and c[idx].match(path)]
        if cands:
            cands.sort(key=lambda c: (c[2].count("{"), -len(c[2])))
            return cands[0]
    return None


def reason(step) -> str:
    resp = step["response"]
    body = resp.get("body", {})
    j = body.get("json")
    if isinstance(j, dict) and j.get("errors"):
        e = j["errors"][0]
        if isinstance(e, dict):
            d = re.sub(r"\s+", " ", str(e.get("detail", "")))
            d = re.sub(r"An unexpected error occurred.*?quote this code: <ERROR_CODE>\.?\s*", "unexpected error: ", d)
            return f"{e.get('error', '')}: {d[:70]}".strip(": ")
    if isinstance(j, dict) and j.get("error"):
        return f"{j.get('error')} (spring default body)"
    if body.get("empty"):
        return "empty body"
    return "see golden"


def main():
    tests = defaultdict(lambda: {"ok": defaultdict(set), "fail": defaultdict(set)})
    n_tests = 0
    n_steps = 0
    for f in sorted(GOLDENS.rglob("*.json")):
        if f.name == "_meta.json":      # hintr/naomi versions of the recording, not a scenario
            continue
        d = json.loads(f.read_text())
        tid = f.relative_to(GOLDENS).with_suffix("").as_posix()
        n_tests += 1
        for s in d["steps"]:
            if s.get("type"):
                continue
            n_steps += 1
            req = s["request"]
            m = match(req["method"], req["path"])
            if not m:
                continue
            status = s["response"]["status"]
            key = (m[1], m[2])
            if status < 400 or status in (301, 302, 303):
                tests[key]["ok"][str(status)].add(tid)
            else:
                tests[key]["fail"][f"{status} {reason(s)}"].add(tid)
    out = []
    out.append("# Coverage\n")
    out.append(f"Generated by `scripts/gen-coverage.py` from {n_tests} golden files ({n_steps} recorded HTTP steps). "
               "Test ids are golden paths relative to `goldens/` (the pytest id is `tests/test_<module>.py::<test name>`).\n")
    out.append("Legend: **success** lists the tests that exercise a 2xx/3xx answer; **failure reasons** lists every distinct "
               "error answer seen (status, hint/hintr error code, message start) with the tests that produce it.\n")
    group = None
    for g, m, t in ENDPOINTS:
        if g != group:
            out.append(f"\n## {g}\n")
            out.append("| Endpoint | Success scenarios | Failure reasons |\n| --- | --- | --- |")
            group = g
        data = tests.get((m, t))
        if not data:
            out.append(f"| `{m} {t}` | **NOT COVERED** | |")
            continue
        ok = "<br>".join(f"{st}: " + ", ".join(sorted(ts)[:4]) + (f" (+{len(ts) - 4})" if len(ts) > 4 else "")
                         for st, ts in sorted(data["ok"].items())) or "none"
        fails = "<br>".join(f"{r}: " + ", ".join(sorted(ts)[:2]) + (f" (+{len(ts) - 2})" if len(ts) > 2 else "")
                            for r, ts in sorted(data["fail"].items())) or "none"
        out.append(f"| `{m} {t}` | {ok} | {fails} |")
    out.append(quirk_section())
    out.append(UNCOVERED)
    sys.stdout.write("\n".join(out) + "\n")


def quirk_section() -> str:
    import ast
    rows = []
    for f in sorted((ROOT / "tests").glob("test_*.py")):
        tree = ast.parse(f.read_text())
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name.startswith("test_"):
                if any("quirk" in ast.unparse(d) for d in node.decorator_list):
                    doc = " ".join((ast.get_docstring(node) or "").split())
                    rows.append(f"| `{f.stem[5:]}/{node.name}` | {doc.replace('quirk:', '').strip() or '(see test)'} |")
    return "\n## Quirks recorded as-is (`@pytest.mark.quirk`)\n\n| Test | Behaviour |\n| --- | --- |\n" + "\n".join(rows) + "\n"


UNCOVERED = """

## Uncovered and why

* **GitHub-token auth of `GET /model/debug/{id}`** (valid and invalid bearer tokens, non-member 401, GitHub API failures
  -> 502). `githubAuthBaseUrl` is hard-coded to `https://api.github.com` in `AppProperties.kt`, so the call cannot be
  redirected to a stub without changing Kotlin, and a real token needs network egress. Covered: missing / wrong-scheme /
  empty bearer header (401 without calling GitHub) and the quirk that an ordinary logged-in session also passes the
  interceptor (`sso/test_model_debug_requires_a_github_bearer_token`).
* **Expired password-reset token.** Tokens are RS256 JWTs signed with a key generated at app start
  (`/etc/hint/token_key` is not writable in the test setup), valid for one day. We cover never-issued, wrong key,
  `alg=none`, reused and empty tokens (all `invalidToken`), but cannot mint an expired token with a valid signature.
* **Real hintr/ADR timeouts.** hint's client timeout is 120 s. `hintr_faults/test_hintr_timeout` (130 s delay) is marked
  `slow` and only runs with `--run-slow`; ADR timeouts are covered by dropped connections instead (same code path: status
  -1 -> "No response returned").
* **Real Auth0 / real ADR / real SMTP / real Teams flow.** All replaced by stubs; the stubs implement only the calls the
  Kotlin client makes (see `hintcontract/stubs/server.py`). `email_mode=smtp` (RealEmailManager) is not exercised: the SUT
  is configured with `email_mode=disk`. Account-creation emails are only sent by the CLI (`add-user` without password).
* **Concurrency behaviour** (parallel uploads of the same file, two tabs saving state at once, session expiry after 120 min,
  server restart invalidating in-memory sessions). Not deterministic enough for goldens; the Python port deliberately
  changes session storage (design R6). A restart-persistence check is documented in README.md, not automated.
* **hint-db migrations and the CLI** (`add-user` etc.): out of scope (only the resulting tables are observed).
* **Real model runs** (non-mock naomi fit): the suite uses hintr's `USE_MOCK_MODEL=true`; the mock fit ignores almost all
  options, so option-dependent failures of the real model are not reachable.
* **hintr routes hint never calls** (`/internal/upload/*`, `/internal/prerun`, `HEAD /download/result` is only used
  indirectly, `GET /calibrate/result/path`): not part of hint's API.
* **Nginx proxy routes** (`/hintr/*` GitHub check, `/queue-length`): not part of the Kotlin app.
* **Static bundle content** (`/public/js/app.js` ...): only status and content type are asserted.
* **Metrics with live worker states**: the number of idle workers (2) is hintr deployment dependent; the golden for
  `/metrics` therefore records the value of the local mock setup.
"""

if __name__ == "__main__":
    main()
