#!/usr/bin/env bash
set -e
HERE=$(realpath "$(dirname $0)")
. $HERE/common

function cleardocker() {
  $HERE/../scripts/clear-docker.sh
}
trap cleardocker EXIT

# Create an image based on the shared build env that runs back-end ADR integration tests
docker build --tag=hint-test-adr \
  --build-arg GIT_ID=$GIT_ID \
  --build-arg CODECOV_TOKEN=$CODECOV_TOKEN \
  -f $HERE/test-adr.dockerfile \
  .

$HERE/../scripts/run-dependencies.sh

# Run the build env image to run gradle tests
docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v $HERE/../src/app/uploads:/uploads \
    --network=hint_nw \
    hint-test-adr
