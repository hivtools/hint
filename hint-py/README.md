# hint-py

Python (FastAPI) backend for hint. It is being built up alongside the Kotlin app, which still handles authentication:
the nginx proxy passes the user's identity to this API in headers (see `app/dependencies.py`).

### Prerequisites

* [uv](https://docs.astral.sh/uv/) for installing Python, package management
* (Optionally) [make](https://www.gnu.org/software/make/). Should be installed by default, except on windows, where it is easiest to install it via [Chocolatey](https://chocolatey.org/install) `choco install make`

## Layout

```
app/main.py          creates the FastAPI app and includes the routers
app/dependencies.py  shared FastAPI dependencies, e.g. who is making the request
app/config.py        settings, read from HINT_* environment variables
app/db/              engine and session (database.py), SQLAlchemy tables (models.py), and the queries, one repository per
                     group of tables. The schema is owned by the Kotlin migrations
app/schemas.py       request and response models
app/errors.py        errors in the format the Vue app expects, with translated messages
app/logging_setup.py where the logs go (see Logging below)
app/messages.py      looks up translations in app/locale/ (gettext .po files, one per language, read with Babel)
app/clients/         the HTTP services this API calls: hintr, ADR and GitHub
app/storage/         the files on the share: the uploads this API writes, and the results hintr writes
app/services/        the rules that combine repositories, storage and clients (e.g. taking in an input file)
app/routers/         one module per group of endpoints
tests/api/           endpoint tests, through the whole app on an in memory test database
tests/db/            repository and session tests
tests/storage/       tests of the files on the share
tests/               everything else (config, errors, messages, dependencies), shared fixtures in conftest.py
```

## Logging

Log with [structlog](https://www.structlog.org): a short message that does not change, and the details as keyword
arguments (they are fields: searchable in JSON and in OpenTelemetry, not part of the message).

```python
import structlog

log = structlog.get_logger()

log.info("Cloning project", project=project_id, users=emails)
log.error("Unexpected error", code=code, status=500, exc_info=exc)  # an exception that was caught earlier
log.exception("No response from hintr", method=method, path=path)  # inside `except`: adds the traceback
```

Field values should be text, numbers, booleans or lists of those (OpenTelemetry drops other types: use `str(path)`).
A field called `name`, `message`, `args` or another name that Python's `logging` keeps for itself gets an `_` at the
end (`name_`). Tracebacks never show the values of variables, as they could be what users sent.

`app/logging_setup.py` (called when the app starts, in the lifespan of `app/main.py`) sends everything to stderr in one format: what this API logs, and
what the libraries it uses log (uvicorn, httpx, SQLAlchemy...). structlog gives its messages to Python's `logging`, so
there is one path for all of them, and OpenTelemetry's handler (if it is on) gets each message once.

| Setting           | Values                                             | Default | What it does                              |
|-------------------|----------------------------------------------------|---------|-------------------------------------------|
| `HINT_LOG_LEVEL`  | `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`    | `INFO`  | The lowest level that is logged           |
| `HINT_LOG_FORMAT` | `console`, `json`, `auto`                          | `auto`  | What the logs look like (see below)       |

- `console`: one line for each message, in colour if stderr is a terminal. For reading while you work.
- `json`: one JSON object for each message. For machines (log collectors, `jq`).
- `auto`: `console` in a terminal, `json` when stderr is not one (in a container, a pipe or a file).

```
make run                                  # in a terminal: coloured lines
HINT_LOG_FORMAT=json make run             # JSON, one object for each message
HINT_LOG_FORMAT=json make run 2>&1 | jq -R 'fromjson? // .'    # JSON, read with jq (the banner that `fastapi dev` prints is left as it is)
HINT_LOG_LEVEL=debug make run
```

In the development stack (`scripts/dev.sh up`) the Python API logs in the `console` format, as `docker compose logs`
is not a terminal. `HINT_LOG_FORMAT=json scripts/dev.sh up` changes that.

In tests, `caplog` sees the messages, and the fields are attributes of the records: `record.getMessage()` is the message
and `record.project` is the field `project`.

### Personal data

A user is an email address, and the logs leave the container (OpenTelemetry sends them to Azure). So do not log an email
or what a user typed (project names, notes, uploaded data). Log ids (project, version, task) and counts instead.

What protects this:

- **The tests.** Every test fails if a message, a field, a traceback or a library's message has the email of a test
  user (`no_personal_data_in_logs` in `tests/conftest.py`). It checks all the requests that the tests make.
- **Database errors** do not have the values of the statement (`hide_parameters` in `app/db/database.py`).
- **The access log** of uvicorn has no query string (`_drop_query_string` in `app/logging_setup.py`).
- **The calls that the API makes** are logged by httpx with their address. The value of each secret in its query (the
  token of ADR's storage, `jwt`) is replaced by `REDACTED` (`_redact_outgoing_url` in `app/logging_setup.py`), as it is
  in their spans (`app/telemetry.py`).
- **No request headers or bodies** are logged, and OpenTelemetry does not collect them unless it is told to.
- **No SQL** is logged.

One thing is logged on purpose: the GitHub login (a public user name) of a developer who asks for a debug zip, so that
there is a record of who downloaded a user's files. GitHub tokens are never logged (the same test checks this).

What does not: a test only catches what the tests do, and the text of an email is easy to miss in free text, so
redacting by pattern would not be a guarantee. Two known gaps: OpenTelemetry's trace of a request has its URL with the
query string (`http.url`; in the spans of the calls that the API makes, secrets are redacted, see `app/telemetry.py`), and the messages that hintr gives are logged as they are (`hintr failed`).

### OpenTelemetry, on your machine

OpenTelemetry sends the logs of the API (with their fields as attributes) and a trace of each request to a collector.
Each call that the API makes to hintr, ADR or GitHub is a span in the trace of its request, with its status and time,
so the code does not time or log the calls itself. The value of a secret query parameter in the address of that span is
replaced by `REDACTED`: ADR's storage gets a token in `jwt` (see `app/telemetry.py`).
To see them locally there is a dashboard (the [.NET Aspire dashboard](https://learn.microsoft.com/dotnet/aspire/fundamentals/dashboard/standalone), which runs in
Docker, keeps what it gets in memory, has no login and only listens on this machine):

```
make otel-up      # start the dashboard: http://localhost:18888
make run-otel     # run the API as `make run` does, sending to it. Look at "Structured logs" and "Traces"
make otel-down    # stop the dashboard
```

In the development stack (`scripts/dev.sh up`) this is on already, and `up` prints the address of the dashboard.
`OTEL=0 scripts/dev.sh up` starts the stack without it.

To see what would be sent without a dashboard, print it instead:
`OTEL_LOGS_EXPORTER=console OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED=true uv run opentelemetry-instrument fastapi dev app/main.py`.

What `make run-otel` does is to start the API with `opentelemetry-instrument` and these settings:

| Variable                                           | Value                     | Why                                        |
|----------------------------------------------------|---------------------------|--------------------------------------------|
| `OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED` | `true`                    | Without it the logs are not sent           |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                      | `http://localhost:4317`   | Where to send (gRPC)                       |
| `OTEL_SERVICE_NAME`                                | `hint-py`                 | The name that the dashboard shows          |

The code needs nothing for this: OpenTelemetry's handler is on the root logger of `logging`, and all logs pass there.

### OpenTelemetry, in production

The code does not change (apart from the one choice in point 3). The image has the OpenTelemetry packages already. What
to do is in the deployment, which is not in this repository ([hint-deploy-azure](https://github.com/hivtools/hint-deploy-azure)):

1. **Start the API with the launcher.** Put `opentelemetry-instrument` in front of the command:
   `uv run --frozen --no-dev opentelemetry-instrument fastapi run app/main.py --port 8000`. (Do not put it in the
   `Dockerfile` for everyone: without a collector it logs errors, as it tries to send to `localhost:4317`.)
2. **Set the variables**: `OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED=true`, `OTEL_SERVICE_NAME=hint-py`,
   `OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production`, and `OTEL_EXPORTER_OTLP_ENDPOINT` (point 3).
   Keep `HINT_LOG_FORMAT` at `auto` (JSON in a container) so that the container logs are structured as well.
3. **Give it somewhere to send to.** The architecture notes say the monitoring is Log Analytics and Application
   Insights. If the API runs in an Azure Container App, turn on the environment's
   [managed OpenTelemetry agent](https://learn.microsoft.com/azure/container-apps/opentelemetry-agents) with
   Application Insights as the destination (it needs the connection string). The platform then gives the app the
   endpoint (`OTEL_EXPORTER_OTLP_ENDPOINT`, gRPC only). Any other OTLP collector works the same way: set the endpoint.
   If the API runs in App Service, which has no such agent, either run a collector next to it, or use Microsoft's
   [`azure-monitor-opentelemetry`](https://learn.microsoft.com/python/api/overview/azure/monitor-opentelemetry-readme)
   package, which sends straight to Application Insights with `APPLICATIONINSIGHTS_CONNECTION_STRING` (that one is a
   few lines of code in `app/main.py`, and is used instead of `opentelemetry-instrument`).

The fields of each log message arrive as custom properties. For example, an error that a user reports with the code
`u1a2b3c4d` is found by searching for the field `code`, as it is in the log as `code=u1a2b3c4d`.

Log fields can hold personal data (`Cloning project` has the emails of the users). Telemetry leaves the container, so
check a new field before you log it.

## First time setup

```
make install
```

This creates the virtual environment and installs the git hooks:

- **on commit**: ruff (lint and format), ty (type check) and some file hygiene checks
- **on push**: pytest

## Day to day

| Command      | When to run it                                                                        |
|--------------|---------------------------------------------------------------------------------------|
| `make run`   | Run the API locally with auto reload. Interactive API docs are at `/docs`.            |
| `make test`  | While developing. Runs pytest with coverage (`coverage.xml` is what CI uploads).      |
| `make check` | Before pushing. Runs every commit hook over all files, plus a check that `uv.lock` is up to date. |
| `make`       | List the available commands.                                                          |

Add a dependency with `uv add <package>` (or `uv add --dev <package>` for dev tools) and commit the changed
`pyproject.toml` and `uv.lock`.

### ADR

The endpoints `/adr/datasets`, `/adr/orgs` and others call ADR, the UNAIDS data repository. `POST /adr/pjnz`,
`/adr/shape`, `/adr/population`, `/adr/survey`, `/adr/programme` and `/adr/anc` import a file from ADR into the user's
version, as an upload of that file would (see `app/services/adr_imports.py`).

**Tests.** `make test` uses a fake ADR (`tests/adr.py`). It is fast, it works without a network, and it can make ADR fail
in ways that the real ADR rarely does. A few more tests call the real dev ADR (`tests/api/test_adr_live.py`). They show
that the real ADR still answers in the way that the fake ADR does. Run them with:

```
export ADR_TEST_KEY=...       # the API key of a test user on the dev ADR (the Kotlin ADR tests use the same variable)
make test-adr
```

They are skipped if `ADR_TEST_KEY` is not set. The dev ADR only accepts some IP addresses (its Front Door blocks bots), so
these tests fail on CI for now. They only read from ADR. They use the dataset `antarctica-country-estimates-2027` in the
organisation `naomi-development-team`, which needs a release called `Version 1.0`, an output zip, and a PJNZ, a shape and
a population file (the import tests download these three).
The tests of rehydrate (`POST /rehydrate/adr`) use another dataset, `malawi-naomi-data-2020-1`, which is public. The output
zips of the other datasets are restricted to the organisation of their country. Its zip was not made by the web app, so
these tests cannot show a project that is loaded, only that a real zip is downloaded and read and refused.

**Settings.** How the API calls ADR for a user:

| Setting                                                   | Default                           | What it is                                                                         |
|-----------------------------------------------------------|-----------------------------------|------------------------------------------------------------------------------------|
| `HINT_ADR_URL`                                            | `https://dev.adr.fjelltopp.org/`  | The address of ADR. The API calls ADR here, and the browser gets it (`/adr/schemas`). |
| `HINT_ENVIRONMENT`                                        | `production`                      | `development` or `production`. `HINT_ADR_API_KEY` needs `development`.             |
| `HINT_ADR_API_KEY`                                        | (none)                            | Development only. The API key of one user on ADR. It is used for users with no token. |
| `HINT_ADR_SCHEMA_THIS_YEAR`, `HINT_ADR_SCHEMA_LAST_YEAR` | `country-estimates-27`, `-26`     | The type of the datasets of this year and of last year                             |

In a real deployment, every user logs in with single sign-on. The proxy passes their access token to the API, and the API
calls ADR as that user. In development, users log in with a password and have no token. Set `HINT_ADR_API_KEY` in your
shell before `scripts/dev.sh up`, and every user calls ADR as the user of that key. (`scripts/dev.sh up` uses the real
ADR unless you set `REAL_ADR=0`.) The API does not start with `HINT_ADR_API_KEY` in production, because every user would
then be the same user on ADR.

**Imports.** The browser sends the link of the file, which ADR gave it. The API sends the user's credential only to
`HINT_ADR_URL`, so:

- The host in the link is not used. The file is downloaded from `HINT_ADR_URL`, with the path and the query of the link.
  The browser sends the link, so it could lead to any site. A list of the hosts of ADR is not kept either: the links of
  the dev ADR start with `https://dev-adr.unaids.org/`, not with its address, and a list would need to be kept up to
  date. A link is refused (400) if it is not an http or https address, or if its path is not under the path of
  `HINT_ADR_URL` (the ADR stub of the dev stack has a path).
- ADR answers with a redirect to its storage, which is on another address. The API follows it, and does not send the
  credential there. The storage does not need it: the redirect has a short-lived token for the file in its query.
- The extension is checked before the download, and the size limit of the type of file (`INPUT_FILE_TYPES` in
  `app/services/input_file_service.py`) applies to the download: it stops as soon as it passes the limit, with the same
  413 as an upload.
- The HTTP client of ADR, which every user's calls share, keeps no cookies. A cookie that ADR set for one user would
  otherwise go with the calls of the others.

### Rehydrate (loading a project from an output zip)

`POST /rehydrate/zip` (an upload) and `POST /rehydrate/adr` (a zip on ADR, which is downloaded as the user, as an import is)
give the Vue app the state and the notes of a project from an output zip, so that it can set the project up
(`app/services/rehydrate_service.py`). A guest may upload a zip. A zip on ADR needs a login.

- Only `info/project_state.json` and `notes.txt` are read. Nothing is extracted and nothing is stored, and the version
  gets no files from it (the Vue app sets them next, with `POST /session/files`).
- A zip is read from a temporary file, in pieces (`app/zip_files.py`), and each entry has a limit (`MAX_STATE_BYTES`,
  `MAX_NOTES_BYTES`), so a zip bomb does not fill the memory. So does the list of the entries (`MAX_DIRECTORY_BYTES`). A zip that cannot be read
  has the same answer as a zip with no state: 400 `failedZipRehydrate`.
- The input files that the state names must be in the uploads folder (matched by the name, the last part of the path), and
  hintr must know the model fit and the calibration (`GET /task/{id}/exists`).
- The zip itself has a size limit of 500 MB (`MAX_OUTPUT_ZIP_BYTES`): the upload is stopped at it, with the same 413
  `FILE_TOO_LARGE` as an input file, and so is the download from ADR. The reasons for the number are in D18 of
  [docs/porting-checklist.md](../docs/porting-checklist.md).

### Debug zips (GitHub)

`GET /model/debug/{id}` sends the debug zip of a model run: hintr makes it from the run's input files and options, so
that a developer can run the model again on their own machine. The R function `hintr::download_debug` calls it. It does
not use the hint login. The caller sends a GitHub token (`Authorization: Bearer <token>`), and the API asks GitHub who
the token's user is and whether that user is an active member of one GitHub team (`github_team_member` in
`app/dependencies.py`). A classic token needs the `read:org` scope to show the team. The proxy sends no hint identity
and no cookie on this path (see `proxy/snippets/python-github.conf`), so a hint session cannot take the place of the
token.

| Setting                      | Default                  | What it is                                                         |
|------------------------------|--------------------------|--------------------------------------------------------------------|
| `HINT_GITHUB_AUTH_ORG`       | (none)                   | The GitHub organisation of the team, for example `hivtools`        |
| `HINT_GITHUB_AUTH_TEAM_SLUG` | (none)                   | The team, as in its URL (`github.com/orgs/<org>/teams/<slug>`), for example `naomi-debug` |
| `HINT_GITHUB_API_URL`        | `https://api.github.com` | The address of the GitHub API. Only tests change it.               |

If the organisation or the team is not set, nobody gets in (403), and GitHub is not called. A real deployment must set
both: the Kotlin app had `hivtools` and `naomi-debug` in its config.

| The caller sends                                | The answer                    |
|-------------------------------------------------|-------------------------------|
| no `Bearer` token                               | 401 `githubTokenRequired`     |
| a token that GitHub does not accept             | 401 `githubTokenInvalid`      |
| a token of a user who is not an active member   | 403 `notInGitHubTeam`         |
| a token, but GitHub fails or does not answer    | 502 `githubFailed`            |
| a token of a member                             | the zip, or hintr's failure (for example 400 `INVALID_TASK` for a task that hintr does not know) |

Each request calls GitHub twice. Nothing is kept between requests: debug zips are rare, and a token that is revoked
stops working at once.

**Tests.** `make test` uses a fake GitHub (`tests/github.py`). `make test-github` calls the real GitHub API with the
token in `HINT_GITHUB_TEST_TOKEN` (`tests/api/test_github_live.py`, skipped without it). It only reads.

### Tests on Postgres

By default the tests use an in memory SQLite database, so they need nothing installed. The same tests can run on a real
Postgres, which checks what SQLite cannot (the real schema, the trigger that sets `updated`, foreign keys):

```
docker compose up -d --wait db db-migrate db-users      # from the repository root
HINT_TEST_DB_URL=postgresql+asyncpg://hintuser:changeme@localhost:5432/hint uv run pytest
```

The database is emptied before every test. The tests refuse to run if it has projects in it, unless
`HINT_TEST_DB_RESET=1` is set. The contract tests in `contract-tests/` cover every endpoint end to end on Postgres
as well.

## CI

`.github/workflows/hint-py.yml` runs on changes under `hint-py/`:

- `make check` on Ubuntu
- the tests on Ubuntu, macOS and Windows, with coverage uploaded to Codecov from Ubuntu
