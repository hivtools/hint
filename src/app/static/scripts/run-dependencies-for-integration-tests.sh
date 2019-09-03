#!/usr/bin/env bash
set -ex

HERE=$(readlink -f "$(dirname $0)")
NETWORK=hint_nw
HINT=hint
$HERE/../../../../scripts/run-dependencies.sh
HINT_VERSION=mrc-417_backend
TEST_CONFIG=$HERE/test.properties
HINT_IMAGE=mrcide/$HINT:$HINT_VERSION
docker pull $HINT_IMAGE

docker run --rm -d \
  --network=$NETWORK \
  --name $HINT \
  -p 8080:8080 \
  -v $TEST_CONFIG:/etc/hint/config.properties \
  $HINT_IMAGE
