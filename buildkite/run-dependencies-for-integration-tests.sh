#!/usr/bin/env bash
set -ex
HERE=$(realpath "$(dirname $0)")
. $HERE/common

NETWORK=hint_nw
HINT=hint
TEST_CONFIG=$HERE/../src/app/static/scripts/test.properties

$HERE/../scripts/run-dependencies.sh

# Build and run docker image of app
$HERE/build.sh node
docker run --rm -d \
  --network=$NETWORK \
  --name $HINT \
  -p 8080:8080 \
  -v $HERE/../src/app/uploads:/uploads \
  -v $TEST_CONFIG:/etc/hint/config.properties \
  node

sleep 5
