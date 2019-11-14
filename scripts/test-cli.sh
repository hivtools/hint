#!/usr/bin/env bash
NETWORK=hint_nw
HERE=$(readlink -f "$(dirname $0)")
TEST_CONFIG=$HERE/../src/app/static/scripts/test.properties

git_id=$(git rev-parse --short=7 HEAD)
image=mrcide/hint-user-cli:${git_id}

docker run --network=$NETWORK \
		-v $TEST_CONFIG:/etc/hint/config.properties \
		$image \
		"$@"

