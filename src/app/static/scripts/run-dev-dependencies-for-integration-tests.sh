#!/usr/bin/env bash
set -ex

HERE=$(readlink -f "$(dirname $0)")
NETWORK=hint_nw
HINT=hint
DB=hint_db
API=hintr
$HERE/../../../../scripts/run-dependencies.sh
HINT_VERSION=master
TEST_CONFIG=$HERE/test.properties
HINT_IMAGE=mrcide/$HINT:$HINT_VERSION

docker run --rm -d \
  --network=$NETWORK \
  --name $HINT \
  -p 8080:8080 \
  -v $TEST_CONFIG:/etc/hint/config.properties \
  $HINT_IMAGE

# From now on, if the user presses Ctrl+C we should teardown gracefully
trap cleanup INT
trap cleanup ERR
function cleanup() {
  docker kill $DB
  docker kill $API
  docker kill $HINT
  docker network rm $NETWORK
}

# Wait for Ctrl+C
echo "Ready to use. Press Ctrl+C to teardown."
sleep infinity
