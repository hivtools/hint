#!/usr/bin/env bash
# One development environment, which is also what the contract tests run against.
#
#   scripts/dev.sh up [--no-proxy] [--rebuild]   everything: postgres, redis, hintr (mock model), the Python API,
#                                                 the nginx front door on :8080, the Kotlin app on :8081, and the
#                                                 stubs the tests use. Browse to http://127.0.0.1:8080
#   scripts/dev.sh down                           stop and remove everything `up` started (containers, volumes)
#   scripts/dev.sh restart-app                    rebuild and restart the Kotlin app after a code change
#   scripts/dev.sh logs [name]                    follow the logs. Without a name: the Kotlin app, the stubs and all the
#                                                 containers. With one: kotlin (or app), kotlin-sso, stubs, or a
#                                                 container (db, redis, hintr, python, proxy, ...)
#   scripts/dev.sh deps                           only postgres, redis and hintr (run Kotlin yourself, e.g. in the IDE)
#   scripts/dev.sh test [pytest args]             run the contract tests (starts the stack first if needed)
#                                                 e.g. test --record, test -k projects, test -x, test --run-slow
#   scripts/dev.sh test-determinism [N]           N replays, restart the app, one more replay; all must pass
#   scripts/dev.sh test-coverage                  rewrite contract-tests/COVERAGE.md from the goldens
#
# Notes
#   * Kotlin talks to the stubs (ADR, SSO identity provider, error-report flow) and, through the recording proxy, to
#     hintr. REAL_ADR=1 scripts/dev.sh up keeps the real ADR from config.properties instead (the tests then refuse to run).
#   * The tests empty the database between scenarios. They stop if it holds projects, files or ADR keys unless you pass
#     --reset-db.
#   * PORT_OFFSET=10000 scripts/dev.sh up starts a second, independent stack (ports and folders shifted by the offset).
#   * up pulls the latest images (hintr included). NO_PULL=1 skips that.
set -euo pipefail

HERE=$(realpath "$(dirname "$0")")
# resolved (no "scripts/.."): paths under $ROOT are handed to docker and to java
ROOT=$(realpath "$HERE/..")
CT=$ROOT/contract-tests
APP_DIR=$ROOT/src/app            # the Kotlin app runs here: it finds static/public relative to it

# ---- one stack = one set of ports, folders and state. PORT_OFFSET makes a second one.
PORT_OFFSET=${PORT_OFFSET:-0}
if [ "$PORT_OFFSET" = 0 ]; then SFX=""; else SFX="-$PORT_OFFSET"; fi
PROJECT=hint$SFX                                    # docker compose project
STATE=$ROOT/.dev$SFX                                # pids, logs, generated config, certificates
export UPLOADS_NAME=${UPLOADS_NAME:-uploads$SFX}    # folders under src/app. The names are what hint puts in its
export RESULTS_NAME=${RESULTS_NAME:-results$SFX}    # requests to hintr, which sees them mounted at /<name>
export DB_PORT=${DB_PORT:-$((5432 + PORT_OFFSET))}
export HINTR_PORT=${HINTR_PORT:-$((8888 + PORT_OFFSET))}
export PROXY_PORT=${PROXY_PORT:-$((8080 + PORT_OFFSET))}      # the front door (Kotlin itself with --no-proxy)
export KOTLIN_PORT=${KOTLIN_PORT:-$((8081 + PORT_OFFSET))}    # Kotlin when it sits behind the nginx proxy
SSO_PORT=${SSO_PORT:-$((8085 + PORT_OFFSET))}                 # second Kotlin instance (oauth2_login_method=true), tests only
FAULT_PORT=${FAULT_PORT:-$((8882 + PORT_OFFSET))}             # recording/faulting proxy in front of hintr (hintr_url)
STUB_PORT=${STUB_PORT:-$((8883 + PORT_OFFSET))}               # stub ADR (/adr/, /adr-sso/) and error-report (/flow)
IDP_PORT=${IDP_PORT:-$((8884 + PORT_OFFSET))}                 # stub OAuth2 identity provider (TLS)
HINTR_VERSION=$(<"$ROOT/src/config/hintr_version")
export HINTR_VERSION

compose() { docker compose -p "$PROJECT" -f "$ROOT/docker-compose.yml" "$@"; }

# ---- small helpers
alive()     { [ -f "$1" ] && kill -0 "$(cat "$1")" 2>/dev/null; }
port_free() { ! (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }   # nothing accepts connections there
need_port() { port_free "$1" || { echo "port $1 is busy (needed for $2). Stop what uses it, or use PORT_OFFSET." >&2; exit 1; }; }
stop_proc() { # $1 = name of a pid file in $STATE
  if alive "$STATE/$1.pid"; then kill "$(cat "$STATE/$1.pid")" 2>/dev/null || true; fi
  rm -f "$STATE/$1.pid"
}
wait_http() { # $1 = label, $2 = url, $3 = seconds
  echo -n "waiting for $1 "
  for _ in $(seq 1 "${3:-120}"); do
    if curl -sf -o /dev/null "$2"; then echo ok; return 0; fi
    echo -n .; sleep 1
  done
  echo; echo "$1 did not answer at $2 (logs are in $STATE and 'docker compose -p $PROJECT logs')" >&2
  return 1
}

# ---- the Python environment of the contract tests, the stub identity provider's certificate
ensure_python_env() {
  (cd "$CT" && unset VIRTUAL_ENV && uv sync -q)
}

ensure_certificate() {
  [ -f "$STATE/idp.pem" ] && return 0
  openssl req -x509 -newkey rsa:2048 -nodes -keyout "$STATE/idp.key" -out "$STATE/idp.crt" -days 3650 \
    -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" >/dev/null 2>&1
  cat "$STATE/idp.key" "$STATE/idp.crt" > "$STATE/idp.pem"
  local java_home_dir
  java_home_dir=$(java -XshowSettings:properties -version 2>&1 | awk -F' = ' '/java.home/ {print $2}')
  cp "$java_home_dir/lib/security/cacerts" "$STATE/truststore.jks"; chmod u+w "$STATE/truststore.jks"
  keytool -importcert -noprompt -alias hintcontract -file "$STATE/idp.crt" -keystore "$STATE/truststore.jks" \
    -storepass changeit >/dev/null
}

ensure_stubs() {
  if alive "$STATE/stubs.pid"; then return 0; fi
  for p in "$FAULT_PORT" "$STUB_PORT" "$IDP_PORT"; do need_port "$p" "the stubs and the recording proxy"; done
  ( cd "$CT" && exec nohup .venv/bin/python -m hintcontract.stubs.server --proxy-port "$FAULT_PORT" \
      --upstream "http://127.0.0.1:$HINTR_PORT" --stub-port "$STUB_PORT" --idp-port "$IDP_PORT" \
      --idp-cert "$STATE/idp.pem" --fixtures-dir "$CT/fixtures" ) > "$STATE/stubs.log" 2>&1 < /dev/null &
  echo $! > "$STATE/stubs.pid"
  sleep 1.5
}

# ---- the Kotlin app
# The app reads config.properties from the classpath, overlaid by /etc/hint/config.properties (not writable for us). So
# each instance gets a directory with a full config.properties, put FIRST on the classpath.
write_config() { # $1 = dir, $2 = application_url, $3 = oauth2_login_method
  mkdir -p "$1"
  python3 - "$APP_DIR/src/main/resources/config.properties" "$1/config.properties" <<PY
import sys
src, dst = sys.argv[1:3]
over = {
 "application_url": "$2", "oauth2_login_method": "$3", "email_mode": "disk",
 "hintr_url": "http://127.0.0.1:$FAULT_PORT",
 "upload_dir": "$UPLOADS_NAME", "results_dir": "$RESULTS_NAME",
 "db_url": "jdbc:postgresql://127.0.0.1:$DB_PORT/hint",
 "issue_report_url": "http://127.0.0.1:$STUB_PORT/flow",
 "oauth2_client_url": "localhost:$IDP_PORT",
}
if "${REAL_ADR:-0}" != "1":
    over["adr_url"] = "http://127.0.0.1:$STUB_PORT/adr/"
    over["oauth2_client_adr_server_url"] = "http://127.0.0.1:$STUB_PORT/adr-sso/"
out = []
for line in open(src).read().splitlines():
    k = line.split("=", 1)[0]
    out.append(f"{k}={over.pop(k)}" if k in over else line)
open(dst, "w").write("\n".join(out) + "\n")
PY
}

resolve_classpath() { # compiles the app if needed
  if [ ! -f "$APP_DIR/static/public/index.ftl" ]; then
    echo "building the frontend (first run)"
    (cd "$ROOT/src" && ./gradlew -q app:compileFrontEnd app:copyAssets)
  fi
  echo "resolving the app classpath with gradle (compiles the app if needed)"
  (cd "$ROOT/src" && CONTRACT_CLASSPATH_OUT="$STATE/classpath.txt" ./gradlew -q -I "$CT/scripts/classpath.init.gradle" \
      -PhotReload=true app:contractPrintClasspath -x copyAssets -x compileFrontEnd)
}

start_app() { # $1 = name (app | app-sso), $2 = port, $3 = application_url, $4 = oauth2_login_method
  if alive "$STATE/$1.pid"; then echo "$1 already running"; return 0; fi
  need_port "$2" "the Kotlin app ($1)"
  write_config "$STATE/conf-$1" "$3" "$4"
  mkdir -p "$APP_DIR/$UPLOADS_NAME" "$APP_DIR/$RESULTS_NAME"
  ( cd "$APP_DIR" && exec nohup java -Dspring.profiles.active=dev -Dserver.port="$2" \
      -Djavax.net.ssl.trustStore="$STATE/truststore.jks" -Djavax.net.ssl.trustStorePassword=changeit \
      -cp "$STATE/conf-$1:$(cat "$STATE/classpath.txt")" org.imperial.mrc.hint.AppStartKt ) \
      > "$STATE/$1.log" 2>&1 < /dev/null &
  echo $! > "$STATE/$1.pid"
}

app_port() { if [ "$(cat "$STATE/mode" 2>/dev/null || echo proxy)" = proxy ]; then echo "$KOTLIN_PORT"; else echo "$PROXY_PORT"; fi; }

# ---- up / down
do_up() { # $1 = pull | nopull, then --no-proxy, --rebuild
  local pull=$1 rebuild=0 mode="" a
  shift
  for a in "$@"; do
    case $a in
      --no-proxy) mode=direct ;;
      --rebuild) rebuild=1 ;;
      *) echo "unknown option $a" >&2; exit 2 ;;
    esac
  done
  mkdir -p "$STATE" "$APP_DIR/$UPLOADS_NAME" "$APP_DIR/$RESULTS_NAME"
  if [ -z "$mode" ]; then mode=$(cat "$STATE/mode" 2>/dev/null || echo proxy); fi
  echo "$mode" > "$STATE/mode"
  if [ "${REAL_ADR:-0}" = 1 ]; then echo 1 > "$STATE/real_adr"; else rm -f "$STATE/real_adr"; fi

  if [ "$pull" = pull ] && [ "${NO_PULL:-0}" != 1 ]; then compose pull -q --ignore-buildable; fi
  if [ "$mode" = proxy ]; then compose --profile proxy up -d --build --wait; else compose up -d --wait; fi
  wait_http hintr "http://127.0.0.1:$HINTR_PORT/" 60

  ensure_python_env
  ensure_certificate
  ensure_stubs
  if [ "$rebuild" = 1 ] || [ ! -s "$STATE/classpath.txt" ]; then resolve_classpath; fi
  start_app app "$(app_port)" "http://127.0.0.1:$PROXY_PORT" false
  wait_http "the Kotlin app" "http://127.0.0.1:$(app_port)/sso" 180
  if [ "$mode" = proxy ]; then wait_http "the proxy" "http://127.0.0.1:$PROXY_PORT/sso" 60; fi

  # users the database starts with: the tests put them back after emptying the database
  if [ ! -f "$STATE/users_seed.json" ]; then
    (cd "$CT" && .venv/bin/python -c "
from pathlib import Path
from hintcontract.env import Env
from hintcontract.controls import Db
e = Env(base_url='x', db_url='postgresql://hintuser:changeme@127.0.0.1:$DB_PORT/hint',
        users_seed_file=Path('$STATE/users_seed.json'))
Db(e).snapshot_seed_users()")
  fi
  echo "Ready: http://127.0.0.1:$PROXY_PORT  (Kotlin :$(app_port), hintr :$HINTR_PORT, postgres :$DB_PORT;" \
       "test user test.user@example.com / password)"
}

do_down() {
  stop_proc app; stop_proc app-sso; stop_proc stubs
  # `down` removes the database and redis, so the uploads and results of this stack are orphans: empty them. This is
  # done from inside the hintr container because hintr writes the results as root.
  compose exec -T hintr sh -c "rm -rf /$RESULTS_NAME/* /$UPLOADS_NAME/*" >/dev/null 2>&1 || true
  compose --profile proxy down --remove-orphans -v
  if [ -n "$SFX" ]; then
    rm -rf "$APP_DIR/$UPLOADS_NAME" "$APP_DIR/$RESULTS_NAME" "$STATE"
  else
    rm -f "$STATE/users_seed.json" "$STATE/mode" "$STATE/real_adr"
    rm -rf "$STATE/conf-app" "$STATE/conf-app-sso"
    rm -rf /tmp/hint_emails
  fi
}

do_restart_app() {
  stop_proc app; stop_proc app-sso
  sleep 3
  resolve_classpath
  start_app app "$(app_port)" "http://127.0.0.1:$PROXY_PORT" false
  wait_http "the Kotlin app" "http://127.0.0.1:$(app_port)/sso" 180
}

# ---- logs. Background tails ignore Ctrl+C, so they are stopped when the script ends
do_logs() { # $1 = nothing, kotlin (app), kotlin-sso, stubs, or the name of a container
  trap 'kill $(jobs -p) 2>/dev/null || true' EXIT
  case "${1:-}" in
    "")
      for f in app stubs; do
        if [ -f "$STATE/$f.log" ]; then tail -n 20 -F "$STATE/$f.log" & fi
      done
      compose --profile proxy logs -f
      ;;
    kotlin|app)  tail -n 50 -F "$STATE/app.log" ;;
    kotlin-sso)  tail -n 50 -F "$STATE/app-sso.log" ;;
    stubs)       tail -n 50 -F "$STATE/stubs.log" ;;
    *)
      local services
      services=$(compose --profile proxy config --services)
      if ! grep -qx "$1" <<<"$services"; then
        echo "unknown log '$1'. Use kotlin, kotlin-sso, stubs or one of: $(echo $services | tr '\n' ' ')" >&2
        exit 2
      fi
      compose --profile proxy logs -f --tail 50 "$1"
      ;;
  esac
}

# ---- the tests
ensure_sso_app() {
  start_app app-sso "$SSO_PORT" "http://127.0.0.1:$SSO_PORT" true
  wait_http "the Kotlin app in SSO mode" "http://127.0.0.1:$SSO_PORT/sso" 180
}

run_pytest() (
  unset VIRTUAL_ENV
  if [ -f "$STATE/real_adr" ]; then
    echo "the stack was started with REAL_ADR=1, so the tests cannot use the ADR stub. Run: scripts/dev.sh down && scripts/dev.sh up" >&2
    exit 1
  fi
  export HINT_BASE_URL=http://127.0.0.1:$PROXY_PORT
  export HINT_DB_URL=postgresql://hintuser:changeme@127.0.0.1:$DB_PORT/hint
  export HINT_PROXY_CONTROL_URL=http://127.0.0.1:$FAULT_PORT
  export HINT_STUB_CONTROL_URL=http://127.0.0.1:$STUB_PORT
  export HINT_APP_PUBLIC_URL=http://127.0.0.1:$PROXY_PORT
  export HINT_ADR_URL=http://127.0.0.1:$STUB_PORT/adr/
  export HINT_ADR_SSO_URL=http://127.0.0.1:$STUB_PORT/adr-sso/
  export HINT_IDP_HOST=localhost:$IDP_PORT
  export HINT_SSO_BASE_URL=http://127.0.0.1:$SSO_PORT
  export HINT_EMAILS_DIR=/tmp/hint_emails
  export HINT_UPLOADS_DIR=$APP_DIR/$UPLOADS_NAME
  export HINT_RESULTS_DIR=$APP_DIR/$RESULTS_NAME
  export HINT_HINTR_UPLOADS_PREFIX=$UPLOADS_NAME
  export HINT_USERS_SEED_FILE=$STATE/users_seed.json
  cd "$CT"
  uv run pytest "$@"
)

# N replays, restart the Kotlin apps, one more replay. Every run must pass. Logs: $STATE/determinism-*.log
do_determinism() {
  local n=${1:-3} fail=0 i rc
  for i in $(seq 1 "$n"); do
    rc=0; run_pytest -q > "$STATE/determinism-$i.log" 2>&1 || rc=$?
    echo "run $i: exit $rc: $(tail -n 1 "$STATE/determinism-$i.log")"; [ "$rc" -ne 0 ] && fail=1
  done
  do_restart_app > "$STATE/determinism-restart.log" 2>&1 || { echo "restart failed"; fail=1; }
  ensure_sso_app > /dev/null 2>&1 || { echo "SSO app failed to start"; fail=1; }
  rc=0; run_pytest -q > "$STATE/determinism-after-restart.log" 2>&1 || rc=$?
  echo "after restart: exit $rc: $(tail -n 1 "$STATE/determinism-after-restart.log")"; [ "$rc" -ne 0 ] && fail=1
  return $fail
}

case "${1:-}" in
  up)
    shift
    do_up pull "$@"
    ;;
  down)
    do_down
    echo "stack removed"
    ;;
  restart-app)
    do_restart_app
    ;;
  logs)
    do_logs "${2:-}"
    ;;
  deps)
    mkdir -p "$APP_DIR/$UPLOADS_NAME" "$APP_DIR/$RESULTS_NAME"
    compose pull -q --ignore-buildable
    compose up -d --wait
    echo "Ready: postgres :$DB_PORT, hintr :$HINTR_PORT. Test user: test.user@example.com / password"
    ;;
  test)
    shift
    do_up nopull
    ensure_sso_app
    run_pytest "$@"
    ;;
  test-determinism)
    shift
    do_up nopull
    ensure_sso_app
    do_determinism "$@"
    ;;
  test-coverage)
    (cd "$CT" && unset VIRTUAL_ENV && uv run python scripts/gen-coverage.py > COVERAGE.md)
    ;;
  *)
    awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"
    exit 1
    ;;
esac
