#!/usr/bin/env bash
set -e
HERE=$(dirname $0)
. $HERE/common

# Create an image based on the shared build env that runs back-end tests
docker build --tag=hint-test \
  --build-arg GIT_ID=$GIT_ID \
  -f $HERE/test.dockerfile \
  .

$HERE/../scripts/run-dependencies.sh

# Run the build env image to run gradle tests
docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    --network=hint_nw \
    hint-test
