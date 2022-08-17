#!/usr/bin/env bash
set -ex
HERE=$(dirname $0)
. $HERE/common

. $HERE/../scripts/add-vault-secrets.sh

# Optional spring profile argument passed when building a testing image
# If it is passed, also use it as the image tag
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
  --build-arg OAUTH2_CLIENT_ID=$OAUTH2_CLIENT_ID \
  --build-arg OAUTH2_CLIENT_SECRET=$OAUTH2_CLIENT_SECRET \
  --build-arg OAUTH2_CLIENT_URL=$OAUTH2_CLIENT_URL \
  -f $HERE/build.dockerfile \
  .

# Run image to create app image
docker run \
  -v /var/run/docker.sock:/var/run/docker.sock \
  hint-build

# We push created docker image in a separate script so that this script can be re-used
# to build a local image for front-end integration testing