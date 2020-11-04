#!/usr/bin/env bash

set -ex
HERE=$(dirname $0)
. $HERE/common

docker tag $USER_CLI_COMMIT_TAG $APP_DOCKER_BRANCH_TAG
docker push $APP_DOCKER_COMMIT_TAG
docker push $APP_DOCKER_BRANCH_TAG

docker tag $USER_CLI_COMMIT_TAG $USER_CLI_BRANCH_TAG
docker push $USER_CLI_COMMIT_TAG
docker push $USER_CLI_BRANCH_TAG
