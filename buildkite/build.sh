#!/usr/bin/env bash
set -ex
HERE=$(dirname $0)
. $HERE/common

if [ -z "$1" ]; then
  TAG=$APP_DOCKER_COMMIT_TAG
else
  TAG=$1
fi

# Create an image based on the shared build env that compiles and builds app image
docker build --tag=hint-build \
  --build-arg GIT_ID=$GIT_ID \
  --build-arg TAG=$TAG \
  --build-arg SPRING_PROFILE=$1 \
  -f $HERE/build.dockerfile \
  .

# Run image to create app image
docker run \
  -v /var/run/docker.sock:/var/run/docker.sock \
  hint-build
