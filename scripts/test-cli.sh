#!/usr/bin/env bash
NETWORK=hint_nw

git_id=$(git rev-parse --short=7 HEAD)
image=mrcide/hint-user-cli:${git_id}
docker run --network=$NETWORK $image "$@"