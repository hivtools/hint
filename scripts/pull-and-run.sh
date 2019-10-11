#!/usr/bin/env bash
set -ex

HERE=$(readlink -f "$(dirname $0)")
NETWORK=hint_nw
HINT=hint
$HERE/run-dependencies.sh

. $HERE/common # sets GIT_BRANCH

TEST_CONFIG=$HERE/../src/app/static/scripts/test.properties
HINT_IMAGE=mrcide/$HINT:$GIT_BRANCH

docker pull $HINT_IMAGE

docker run --rm -d \
  --network=$NETWORK \
  --name $HINT \
  -p 8080:8080 \
  -v $HERE/../src/app/uploads:/uploads \
  $HINT_IMAGE

docker cp $TEST_CONFIG $HINT:/etc/hint/config.properties
