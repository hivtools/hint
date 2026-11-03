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

Authentication and sessions stay in Kotlin until login moves. For each request to a Python location:

```
browser --cookie--> nginx --(auth_request, cookie)--> Kotlin GET /internal/whoami
                      |                                   returns 204 + X-Hint-User (+ X-Hint-Guest-Versions)
                      +--(no cookie, X-Hint-* headers)--> Python
```

- nginx overwrites any `X-Hint-*` headers sent by the client, so they cannot be forged, as long as Python is only
  reachable through nginx (in docker-compose it is not published to the host).
- `/internal/` (Kotlin) and `/_whoami` (nginx) are not reachable from outside.
- whoami does not start a Kotlin session. A visitor gets their `JSESSIONID` from the first Kotlin page or endpoint they
  use, and nginx passes any `Set-Cookie` from whoami on.
- The version a request works on is not part of the identity. The browser tab sends it in `X-Version-Id` on every
  request, nginx passes it on, and each app checks that the user may use it (in Python, the `current_version_id`
  dependency). A logged in user may use a version of one of their projects, which Python checks in Postgres. A guest has
  no projects: the versions Kotlin gave them (`POST /guest/version`) are in the Kotlin session, so whoami passes them to
  Python in `X-Hint-Guest-Versions` (comma separated, only for guests who have some). Anything else Python needs to
  *change* in the Kotlin session would need another `/internal/` endpoint.
- The guest versions grow by 37 bytes for each tab a guest opens, and the auth_request response headers must fit in one
  nginx buffer, so the `/_whoami` location sets `proxy_buffer_size 32k` (about 800 versions).
- When login and sessions move to Python, only `current_user` changes and `/internal/whoami` and `auth_request` go.

## Running it

- `scripts/dev.sh up`: dependencies, Python, nginx on :8080 and Kotlin on :8081 (`down`, `logs`, `deps` too).
- `scripts/dev.sh test`: the regression suite, through the proxy (starts its own private test stack).
