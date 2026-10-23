# Proxy: migrating endpoints from Kotlin to Python

nginx sits in front of both apps. Everything goes to Kotlin (`src/app`) unless it has a `location` in
[nginx.conf.template](nginx.conf.template) that goes to Python (`hint-py`).

## Moving an endpoint to Python

1. Implement it in `hint-py`. Take the user from `Depends(current_user)` (or `logged_in_user` for endpoints that
   Kotlin protects with `SecurePaths`), see `hint-py/identity.py`.
2. Add a location to `nginx.conf.template` (the most specific prefix wins):

   ```nginx
   location /project/ { include snippets/python.conf; }
   ```
3. `scripts/dev.sh up`, then run the regression suite (below).

## How Python knows who is calling

Authentication and sessions stay in Kotlin until login moves. For each request to a Python location:

```
browser --cookie--> nginx --(auth_request, cookie)--> Kotlin GET /internal/whoami
                      |                                   returns 204 + X-Hint-User, X-Hint-Version-Id
                      +--(no cookie, X-Hint-* headers)--> Python
```

- nginx overwrites any `X-Hint-*` headers sent by the client, so they cannot be forged, as long as Python is only
  reachable through nginx (in docker-compose it is not published to the host).
- `/internal/` (Kotlin) and `/_whoami` (nginx) are not reachable from outside.
- A first time visitor gets their `JSESSIONID` from the whoami call, and nginx passes the `Set-Cookie` on.
- Kotlin keeps the session `version_id`, so both apps agree on it. Anything Python needs to *change* in the session
  would need another `/internal/` endpoint, add those as they come up.
- When login and sessions move to Python, only `current_user` changes and `/internal/whoami` and `auth_request` go.

## Running it

- `scripts/dev.sh up`: dependencies, Python, nginx on :8080 and Kotlin on :8081 (`down`, `logs`, `deps` too).
- `scripts/dev.sh test`: the regression suite, through the proxy (starts its own private test stack).
