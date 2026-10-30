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
app/messages.py      looks up translations in app/locale/ (gettext .po files, one per language, read with Babel)
app/services/        logic that spans repositories
app/routers/         one module per group of endpoints
tests/api/           endpoint tests, through the whole app on an in memory test database
tests/db/            repository and session tests
tests/               everything else (config, errors, messages, dependencies), shared fixtures in conftest.py
```

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
