#!/usr/bin/env bash
set -ex

HERE=$(dirname $0)
. $HERE/common

NETWORK=hint_nw
HINT=hint
TEST_CONFIG=$HERE/src/app/static/test.properties
HINT_IMAGE=mrcide/$HINT:$GIT_BRANCH

# Build and run docker image of app
$HERE/build.sh node
docker run --rm -d \
  --network=$NETWORK \
  --name $HINT \
  -p 8080:8080 \
  -v $HERE/../src/app/uploads:/uploads \
  -v $TEST_CONFIG:/etc/hint/config.properties \
  node
