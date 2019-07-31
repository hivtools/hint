#!/usr/bin/env bash
set -ex

HERE=$(dirname $0)
PACKAGE_ROOT=$(realpath $HERE/..)
GIT_ID=$(git -C "$PACKAGE_ROOT" rev-parse --short=7 HEAD)

if [ -z "$TRAVIS_BRANCH" ]; then
    GIT_BRANCH=$(git -C "$PACKAGE_ROOT" symbolic-ref --short HEAD)
else
    GIT_BRANCH=$TRAVIS_BRANCH
fi

REGISTRY=mrcide
NAME=hint

APP_DOCKER_TAG=$REGISTRY/$NAME
APP_DOCKER_COMMIT_TAG=$REGISTRY/$NAME:$GIT_ID
APP_DOCKER_BRANCH_TAG=$REGISTRY/$NAME:$GIT_BRANCH

docker build . --tag hint-dist-base \
    && ./app/gradlew -p app :distDocker -i -Pdocker_version=$GIT_ID -Pdocker_name=$APP_DOCKER_TAG \
    && docker tag $APP_DOCKER_COMMIT_TAG $APP_DOCKER_BRANCH_TAG \
    && docker push $APP_DOCKER_BRANCH_TAG

