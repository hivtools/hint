#!/usr/bin/env bash
set -e
HERE=$(dirname $0)
. $HERE/common

docker build -f $HERE/make-base-image.dockerfile \
    -t $BUILD_ENV_TAG \
    .