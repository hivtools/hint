# Proxy: migrating endpoints from Kotlin to Python

nginx sits in front of both apps. Everything goes to Kotlin (`src/app`) unless it has a `location` in
[nginx.conf.template](nginx.conf.template) that goes to Python (`hint-py`).

## Moving an endpoint to Python

1. Implement it in `hint-py`. Take the user from `Depends(current_user)` (or `logged_in_user` for endpoints that
   Kotlin protects with `SecurePaths`), see `hint-py/dependencies.py`.
2. Add a location to `nginx.conf.template` (the most specific prefix wins):

   ```nginx
   location /project/ { include snippets/python.conf; }
   ```
3. `scripts/dev.sh up`, then run the regression suite (below).

## How Python knows who is calling

Python logs users in and keeps the sessions in Postgres (`hint-py/app/services/web_sessions.py`, table `web_session`).
The browser's `hint_session` cookie goes to Python as it is, through `snippets/python.conf`, and Python reads the user
from it. Kotlin is no longer asked, and its own session (`JSESSIONID`) knows nobody: the endpoints still on Kotlin answer
as for a guest.

- Login: `/login` (the page), `/oauth2` and `/register` (start a login with Auth0), `/callback/oauth2Client` (where
  Auth0 sends the browser back), `/logout`, and in development `/dev-login`. All go to Python.
- The version a request works on is not part of the identity. The browser tab sends it in `X-Version-Id` on every
  request, nginx passes it on, and Python checks that the user may use it (`current_version_id`). A guest may use the
  versions that `POST /guest/version` gave to their session.
- A single sign-on user's Auth0 access token is kept in their session row, never in the cookie, and Python calls ADR as
  them with it.
- `snippets/python-public.conf` (the page and `/public/`) and `snippets/python-github.conf` (`/model/debug/{id}`) do not
  send the `Cookie` header, so those requests never read a session. For the debug zip that means a hint session cannot
  take the place of the GitHub token.
- A `location` cannot choose by method, so every method of a path goes to the same app. Port the methods of a path
  together.

## Running it

- `scripts/dev.sh up`: dependencies, Python, nginx on :8080 and Kotlin on :8081 (`down`, `logs`, `deps` too).
- `scripts/dev.sh test`: the regression suite, through the proxy (starts its own private test stack).
