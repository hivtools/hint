#!/usr/bin/env bash
set -ex

HERE=$(realpath  "$(dirname $0)")
. $HERE/common

export NODE_ENV=production

$HERE/../src/gradlew -p $HERE/../src :app:bootDistTar

( cd $HERE/../src ;
docker build --build-arg SPRING_PROFILES_ACTIVE=$1 -f ../Dockerfile --tag $APP_DOCKER_COMMIT_TAG . \
    && docker tag $APP_DOCKER_COMMIT_TAG $APP_DOCKER_BRANCH_TAG
)
