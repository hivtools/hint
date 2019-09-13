#!/usr/bin/env bash
set -ex

HERE=$(readlink -f "$(dirname $0)")
NETWORK=hint_nw
HINT=hint
DB=hint_db
API=hintr
REDIS=hintr_redis

$HERE/run-dependencies-for-integration-tests.sh

# From now on, if the user presses Ctrl+C we should teardown gracefully
trap cleanup INT
trap cleanup ERR
function cleanup() {
  docker kill $DB
  docker kill $API
  docker kill $HINT
  docker kill $REDIS
  docker network rm $NETWORK
}

# Wait for Ctrl+C
echo "Ready to use. Press Ctrl+C to teardown."
sleep infinity
