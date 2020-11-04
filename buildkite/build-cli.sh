#!/usr/bin/env bash
set -ex
HERE=$(realpath "$(dirname $0)")
. $HERE/common

function cleardocker() {
  $HERE/../scripts/clear-docker.sh
}
trap cleardocker EXIT

# Create an image based on the shared build env that compiles, tests and builds CLI image
docker build --tag=hint-cli-build \
  --build-arg GIT_ID=$GIT_ID \
  -f $HERE/build-cli.dockerfile \
  .

$HERE/../scripts/run-dependencies.sh

# Run image to test and build CLI image
docker run \
  --network=hint_nw \
  -v /var/run/docker.sock:/var/run/docker.sock \
  hint-cli-build

docker tag $USER_CLI_COMMIT_TAG $USER_CLI_BRANCH_TAG
docker push $USER_CLI_COMMIT_TAG
docker push $USER_CLI_BRANCH_TAG
