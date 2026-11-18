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
app/services/        logic that spans repositories
app/routers/         one module per group of endpoints
tests/api/           endpoint tests, through the whole app on an in memory test database
tests/db/            repository and session tests
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
- **No request headers or bodies** are logged, and OpenTelemetry does not collect them unless it is told to.
- **No SQL** is logged.

What does not: a test only catches what the tests do, and the text of an email is easy to miss in free text, so
redacting by pattern would not be a guarantee. Two known gaps: OpenTelemetry's trace of a request has its URL with the
query string (`http.url`), and the messages that hintr gives are logged as they are (`hintr failed`).

### OpenTelemetry, on your machine

OpenTelemetry sends the logs of the API (with their fields as attributes) and a trace of each request to a collector.
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

The endpoints `/adr/datasets`, `/adr/orgs` and others call ADR, the UNAIDS data repository.

**Tests.** `make test` uses a fake ADR (`tests/adr.py`). It is fast, it works without a network, and it can make ADR fail
in ways that the real ADR rarely does. A few more tests call the real dev ADR (`tests/api/test_adr_live.py`). They show
that the real ADR still answers in the way that the fake ADR does. Run them with:

```
export ADR_TEST_KEY=...       # the API key of a test user on the dev ADR (the Kotlin ADR tests use the same variable)
make test-adr
```

They are skipped if `ADR_TEST_KEY` is not set. The dev ADR only accepts some IP addresses (its Front Door blocks bots), so
these tests fail on CI for now. They only read from ADR. They use the dataset `antarctica-country-estimates-2027` in the
organisation `naomi-development-team`, which needs a release called `Version 1.0` and an output zip.

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
