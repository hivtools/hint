#!/usr/bin/env bash
set -ex

# Disable path conversion when running Git Bash in Windows
export MSYS_NO_PATHCONV=1

HERE=$(dirname "$0")
NETWORK=hint_nw
DB=hint_db
API=hintr
REDIS=hintr_redis

"$HERE"/run-dependencies.sh
"$HERE"/add-guest-user.sh

# From now on, if the user presses Ctrl+C we should teardown gracefully
trap cleanup INT
trap cleanup ERR
function cleanup() {
  docker kill $DB
  docker kill $API
  docker kill $REDIS
  docker network rm $NETWORK
}

# Wait for Ctrl+C
echo "Ready to use. Press Ctrl+C to teardown."
sleep infinity

