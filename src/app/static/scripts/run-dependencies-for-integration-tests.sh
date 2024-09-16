#!/usr/bin/env bash
set -ex

HERE=$(realpath "$(dirname $0)")
NETWORK=hint_nw
HINT=hint
$HERE/../../../../scripts/run-dependencies.sh

. $HERE/../../../../scripts/common # sets GIT_BRANCH
$HERE/../../../../scripts/build-app.sh node

TEST_CONFIG=$HERE/test.properties
HINT_IMAGE=ghcr.io/hivtools/$HINT:$GIT_BRANCH

docker run --rm -d \
  --network=$NETWORK \
  --name $HINT \
  -p 8080:8080 \
  -v $HERE/../../../../src/app/uploads:/uploads \
  -v $TEST_CONFIG:/etc/hint/config.properties \
  $HINT_IMAGE
