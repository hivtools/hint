#!/usr/bin/env bash
set -ex

HERE=$(realpath  "$(dirname $0)")
. $HERE/common

export NODE_ENV=production

. $HERE/add-vault-secrets.sh

$HERE/../src/gradlew -p $HERE/../src :app:bootDistTar

( cd $HERE/../src ;
  docker build --build-arg SPRING_PROFILES_ACTIVE=$1 -f ../Dockerfile \
    --tag $APP_DOCKER_COMMIT_TAG . \
    -env OAUTH2_CLIENT_ID=$OAUTH2_CLIENT_ID \
    -env OAUTH2_CLIENT_SECRET=$OAUTH2_CLIENT_SECRET \
    -env OAUTH2_CLIENT_URL=$OAUTH2_CLIENT_URL \
    && docker tag $APP_DOCKER_COMMIT_TAG $APP_DOCKER_BRANCH_TAG
)
