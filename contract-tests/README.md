# hint contract tests

Black-box regression ("contract") tests for the hint web API. They were recorded against the current Kotlin/Spring
app and are meant to be replayed, unchanged, against the planned Python/FastAPI rewrite: the tests only speak HTTP to
`--base-url`, and optionally look at the side effects the port must preserve (Postgres rows, the uploads directory,
emails written to disk, the calls hint makes to hintr / ADR).

* `COVERAGE.md` - every endpoint x scenario (success and each failure reason) with test ids, plus **Uncovered and why**.
* `goldens/` - one pretty-printed JSON file per scenario (human reviewable, diff friendly).
* `tests/` - the scenarios (Python, pytest + httpx).  `hintcontract/` - the harness.  `scripts/` - SUT scripts.
* Tests tagged `@pytest.mark.quirk` record behaviour that looks like a bug or a surprise, **as is** (the docstring says
  why). A port that fixes one of these should fail that test on purpose: re-record it deliberately and mention it in the
  PR. `pytest -m quirk` lists them; `pytest -m "not quirk"` runs the rest.

## Quick start (Kotlin app, everything local)

Requirements: Docker, Java 17, `uv` (or Python >= 3.11 + pip), `psql` not needed. The images
`ghcr.io/hivtools/{hint-db,hint-db-migrate,hintr,hint-user-cli}` and `redis:7-alpine` must be present or pullable
(`scripts/dev.sh up` pulls them, so the tests run against the latest hintr; `NO_PULL=1` skips that).

```bash
# one script for everything, run from the repository root (`scripts/dev.sh` prints all commands)
scripts/dev.sh up                       # postgres + redis + hintr (mock model) + Python API + nginx front door (:8080) +
                                        # the Kotlin app (:8081) + the stubs and the recording proxy the tests use
scripts/dev.sh test                     # replay: compare the running app with the goldens (starts `up` if needed)
scripts/dev.sh test --record            # (re)write goldens from the running app
scripts/dev.sh test -k projects         # any pytest args
scripts/dev.sh down                     # remove everything `up` started
scripts/dev.sh up --no-proxy            # Kotlin only, on :8080: the baseline the goldens were recorded and verified against
```

This is the same stack you browse (http://127.0.0.1:8080), so **the tests empty its database between scenarios**. They stop
at the start if it holds projects, uploaded files, ADR keys or extra users, unless you pass `--reset-db`
(`scripts/dev.sh test --reset-db`). To browse and test at the same time, start a second stack with
`PORT_OFFSET=10000 scripts/dev.sh up` (its own ports, folders, database and state) and run the tests against it with
`PORT_OFFSET=10000 scripts/dev.sh test`.

In this stack Kotlin talks to the stubs (ADR, the SSO identity provider and the error-report flow), not to the real
services. `REAL_ADR=1 scripts/dev.sh up` keeps the real ADR for manual work; the tests then refuse to run.

With the proxy in front (the default) the whole suite runs through nginx, and `tests/test_python_bridge.py` additionally
checks the identity bridge to the Python API (skipped with `up --no-proxy`). See `../proxy/README.md`.

Ports (each shifted by `PORT_OFFSET`): postgres 5432, hintr 8888, the front door 8080, Kotlin 8081, Kotlin in SSO mode 8085
(started by `test`), recording/faulting proxy in front of hintr 8882, stubs 8883, stub identity provider 8884. `up`
refuses to start a process if its port is busy. It never runs `docker network prune` and only touches its own compose
project (`hint`, or `hint-<offset>`).

hint sends hintr the relative path `uploads/<HASH>` (`upload_dir=uploads`, as in production). hintr runs in `/` and has the
folder `src/app/uploads` mounted at `/uploads`, so both see the same files whatever the operating system of the host. A
stack with an offset uses `uploads-<offset>` and `results-<offset>` instead.

The Kotlin app is started with `java -cp .dev/conf-app:<gradle runtime classpath>` so that a generated `config.properties`
(ports, stub urls, `email_mode=disk`) is found before the one in the jar: no file under `src/` is modified. State (pids,
logs, generated config, certificates) is in `.dev/`. The first `up` needs network for Gradle to resolve the classpath;
`scripts/dev.sh up --rebuild` or `restart-app` recompiles and redoes it after a code change.

A full run (about 330 scenarios, 2,200 recorded HTTP steps) takes about 7 minutes, most of it the mock model's fits,
calibrations and downloads. Run a subset with e.g. `scripts/dev.sh test tests/test_projects.py`.
`scripts/dev.sh test --run-slow` additionally runs the 130 s hintr-timeout test.

## What the SUT must look like (for the Python port)

The suite assumes the same configuration contract as the Kotlin app (`config.properties`):

| What | Setting / requirement | pytest option |
| --- | --- | --- |
| HTTP base url | any | `--base-url` |
| hintr | `hintr_url` points at the **recording/faulting proxy** (`python -m hintcontract.stubs.server`), which forwards to a real hintr started with `USE_MOCK_MODEL=true`; hintr must see the uploads dir at the same absolute path hint writes in its requests (or pass `--hintr-uploads-prefix`) | `--proxy-control-url` |
| ADR | `adr_url` = stub `http://host:port/adr/`; `oauth2_client_adr_server_url` = stub `.../adr-sso/` | `--stub-control-url`, `--adr-url`, `--adr-sso-url` |
| Issue report | `issue_report_url` = stub `.../flow` | (same stub) |
| SSO | `oauth2_client_url=localhost:<idp port>` (hint builds `https://<it>/authorize` etc.; the stub IdP is TLS, so hint's JVM/Python must trust `.run/idp.crt`), `oauth2_client_id=fakeId`, `application_url` | `--idp-host`, `--app-public-url` |
| Postgres | same schema as `hint-db` migrations, seeded with `test.user@example.com`/`password`, `naomi-support@imperial.ac.uk`/`password`, `guest` | `--db-url` |
| Uploads | `upload_dir`; files named `<UPPERCASE MD5 of content>.<text after last dot>` | `--uploads-dir` |
| Emails | `email_mode=disk` writing to `/tmp/hint_emails` (one file per email) | `--emails-dir` |
| SSO mode | second instance with `oauth2_login_method=true` | `--sso-base-url` |
| Support user | `support_email=naomi-support@imperial.ac.uk` | |

Every option can also be given as an environment variable (`HINT_BASE_URL`, `HINT_DB_URL`, `HINT_UPLOADS_DIR`,
`HINT_PROXY_CONTROL_URL`, `HINT_STUB_CONTROL_URL`, ...; see `conftest.py`). Without `--db-url` / `--uploads-dir` /
`--proxy-control-url` the corresponding golden parts (db snapshots, upload listings, outbound call assertions) are skipped
and tests marked `needs_db` / `needs_uploads` / `faulting` are skipped; the black-box HTTP assertions still run.

Against the Python port (Kotlin stays up as a reference if you like):

```bash
cd contract-tests && unset VIRTUAL_ENV
uv run pytest --base-url http://127.0.0.1:8000 --db-url postgresql://hintuser:changeme@127.0.0.1:5432/hint \
   --uploads-dir /path/to/port/uploads --proxy-control-url http://127.0.0.1:8882 --stub-control-url http://127.0.0.1:8883 \
   --app-public-url http://127.0.0.1:8000
```
(`scripts/dev.sh up` runs the supporting containers, stubs and recording proxy for you: start it, stop only the Kotlin app
with `kill $(cat .dev/app.pid)`, and point the port at the same hintr proxy / stub ports / db.)
The port's session cookie name does not matter (the suite never mentions `JSESSIONID`); it only asserts that *a* cookie
is set where the golden says `session_cookie: set`, and that sessions are isolated per cookie jar.

## How it works

* **Scenario** (`hintcontract/scenario.py`): a pytest test using the `scn` fixture. `scn.client("A")` / `scn.client("B")`
  are independent clients with their own cookie jar (cookies are handled by hand: the Kotlin session cookie is
  `Secure` over plain http and its name is implementation specific). Every request becomes a *step*.
* **Reset between scenarios** (`prepare()`): truncate all data tables with `restart identity cascade`, restore the seeded
  `users` rows from `.dev/users_seed.json`, empty the uploads and emails dirs, reset proxy/stub state and faults.
  Project ids are therefore deterministic and tests are order independent. (The expensive mock-model pipeline is the one
  shared, session-scoped thing: hintr results live in Redis/results, not in hint's database; it has its own golden
  `_pipeline/model_pipeline`.)
* **Golden step** = `request` (method, normalised path, query, allow-listed headers incl. `Accept-Language`, JSON /
  form / multipart body with files described by name, size, sha256, fixture) + `response` (status, allow-listed headers
  -- media type only, `Location`, `Content-Disposition`... -- and the normalised body) + optional
  `session_cookie`, `poll`, `outbound` (calls hint made to hintr/ADR/IdP/flow) and extra steps `db` (table snapshot),
  `uploads` (directory listing with a check that each name is the md5 of the content) and `emails`.
* **Normalisation** (`hintcontract/normalize.py`): UUIDs -> `<UUID:n>`, project ids -> `<PROJECT:n>`, hintr task ids ->
  `<TASK:label|n>` (labels for the pipeline ids), JWTs -> `<JWT:n>`, timestamps -> `<TIMESTAMP>`, epoch ms,
  error codes `uxx-xxx-xxx` and hintr error keys, `... elapsed` progress strings, the OAuth `state`, absolute paths
  (`<UPLOADS>`, `<RESULTS>`, `<APP>`, `<ADR>`, `<IDP_HOST>`). Tokens are numbered by first appearance (dict keys are
  visited in sorted order so server key order does not matter). The test code itself carries real values from earlier
  responses into later requests, so replay "re-binds" naturally.
* **Comparison** (`compare.py`): deep equality with float tolerance (rel 1e-6), dict key order ignored, list order
  significant unless a step passes `unordered=[...]`. Bodies over 60 KB (survey validation is 13 MB) are stored as a
  digest of everything but numbers + number statistics (count/sum/min/max, compared with tolerance) + a shape summary;
  on a mismatch the full actual run is written to `.artifacts/<scenario>.actual.json`. Binary bodies (zip, xlsx, html
  downloads) are summarised by their zip member names / magic; HTML pages by status, content type, `<title>` and
  caller-chosen substrings.
* **Polling**: `client.poll(path, until, "description")` repeats a request until it satisfies the condition and records
  only the final response, so a varying number of status calls does not matter.
* **Outbound calls**: the proxy in front of hintr and the stub ADR/flow/IdP record method, path, query, body and
  `Accept-Language` / `Authorization` of every call hint makes; each step's golden contains the calls it caused (hintr
  `/wake` pings are ignored: timing dependent). Output-file digests that differ per session are masked.
* **Faults**: `scn.set_faults("hintr" | "stub", [fault({...}, path_regex)])` makes the proxy/stub answer with a status,
  malformed body, delay or a dropped connection (see the module docstring of `hintcontract/stubs/server.py`).
* **Stub ADR** (`hintcontract/stubs/server.py`): implements the CKAN calls hint makes (`package_search`, `package_show`,
  `dataset_version_list`, `organization_list_for_user`, `package_activity_list`, `version_delete`,
  `dataset_version_create`, `resource_create`, `resource_patch`, `resource_show`, resource downloads incl. redirects).
  State is set per test with `scn.set_stub(datasets=..., releases=..., files=...)`.

## Adding a test

1. Write it in `tests/test_<area>.py` using the `scn` fixture (see any existing module). Use `hintcontract.flows` helpers
   (`login_and_open`, `upload`, `create_project`, `MODEL_OPTIONS`, ...) and the fixtures in `fixtures/` (copies of
   `src/app/testdata`). For anything needing a finished model fit / calibration / downloads, take the `pipeline` fixture
   and call `pipeline.bind(scn)`.
2. Name steps (`name="..."`) - they are the readable part of the golden. Use `scn.quiet()` for setup you do not want in the
   golden. Call `scn.db_rows("version_file")`, `scn.uploads()`, `scn.emails()` to assert side effects.
3. If the behaviour is surprising, add `@pytest.mark.quirk` and say why in the docstring.
4. `scripts/dev.sh test tests/test_x.py::test_y --record`, review `goldens/x/test_y.json` (`scripts/show-golden.py
   goldens/x/test_y.json` gives a compact view), then run it again without `--record`.
5. `scripts/dev.sh test-coverage` refreshes the coverage matrix.

Where hint relays hintr's answer unchanged (most hintr endpoints), the golden does not store the body: it says
`same_as_upstream: hintr` and the test compares hint's body with hintr's own answer from the same run (the recording
proxy keeps it in memory), so hintr's content, messages and versions are not part of the goldens.

`goldens/_meta.json` records the hintr/naomi version of the recording. If the running hintr differs the session stops
with both versions printed (hintr can still change status codes or request handling). Re-record the whole suite and review
the diff: `scripts/dev.sh test --record` (a partial `--record` with a different version is refused). `--allow-hintr-drift`
(or `HINT_ALLOW_HINTR_DRIFT=1`) runs anyway, with a warning.

## Determinism

`scripts/dev.sh test-determinism [N]` replays the goldens N (default 3) times and once more after `scripts/dev.sh restart-app`; all runs
must pass against an unchanged Kotlin app. Anything flaky must be fixed in normalisation / polling / ordering, not retried.
Things that were flaky and how they are handled: DuckDB row order of `filteredData` (`unordered=["data"]`), elapsed-time
progress strings (`<ELAPSED>`), random ids/keys/tokens (tokenised), zip/xlsx contents (member names only),
`/metrics` worker counts (format only), session-dependent digests of generated uploads (`Upload(volatile=True)`).

A few tests sleep on purpose or wait for hintr (mock fit 5 s, polls every 0.4 s, timeout 120 s). If your machine is slow,
the polling timeouts are the only thing to raise (`poll(..., timeout=)`).
