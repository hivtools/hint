# Proxy: the front door of the Python API

nginx sits in front of the Python API (`hint-py`) and sends it every path ([nginx.conf.template](nginx.conf.template)).
It was the way to move the endpoints from Kotlin to Python one group at a time. The move is done, and Kotlin (`src/app`)
is no longer routed: what only Kotlin served answers 404 (D23 in `docs/porting-checklist.md`).

## How Python knows who is calling

Python logs users in and keeps the sessions in Postgres (`hint-py/app/services/web_sessions.py`, table `web_session`).
The browser's `hint_session` cookie goes to Python as it is, through `snippets/python.conf`, and Python reads the user
from it.

- Login: `/login` (the page), `/oauth2` and `/register` (start a login with Auth0), `/callback/oauth2Client` (where
  Auth0 sends the browser back), `/logout`, and in development `/dev-login`.
- The version a request works on is not part of the identity. The browser tab sends it in `X-Version-Id` on every
  request, nginx passes it on, and Python checks that the user may use it (`current_version_id`). A guest may use the
  versions that `POST /guest/version` gave to their session.
- A single sign-on user's Auth0 access token is kept in their session row, never in the cookie, and Python calls ADR as
  them with it.
- `snippets/python-public.conf` (the page and `/public/`) and `snippets/python-github.conf` (`/model/debug/{id}`) do not
  send the `Cookie` header, so those requests never read a session. For the debug zip that means a hint session cannot
  take the place of the GitHub token.

## Running it

- `scripts/dev.sh up`: dependencies, Python and nginx on :8080 (`down`, `logs`, `deps` too). `up --no-proxy` runs the
  old Kotlin app alone on :8080 instead.
- `scripts/dev.sh test`: the regression suite, through the proxy (starts its own private test stack).
