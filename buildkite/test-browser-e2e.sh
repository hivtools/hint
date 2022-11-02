#!/usr/bin/env bash
set -ex
HERE=$(dirname $0)
. $HERE/common

function cleardocker() {
  docker logs hint
  $HERE/../scripts/clear-docker.sh
}
trap cleardocker EXIT

# Run all dependencies
$HERE/run-dependencies-for-integration-tests.sh

# Wait for HINT to become responsive
sleep 10000

# Create an image based on the shared build env that compiles and tests the front-end ADR integration
docker build --tag hint-test-browser-e2e \
  --build-arg GIT_ID=$GIT_ID \
  -f $HERE/test-browser-e2e.dockerfile \
  .

# Run the created image
docker run --rm \
  --network=hint_nw \
  hint-test-browser-e2e
