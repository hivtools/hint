#!/usr/bin/env bash
set -ex

HERE=$(dirname "$0")
NETWORK=hint_nw
DB=hint_db
API=hintr

"$HERE"/run-dependencies.sh

# From now on, if the user presses Ctrl+C we should teardown gracefully
trap cleanup INT
trap cleanup ERR
function cleanup() {
  docker stop $DB
  docker stop $API
  docker network rm $NETWORK
}

# Wait for Ctrl+C
echo "Ready to use. Press Ctrl+C to teardown."
sleep infinity
