#!/usr/bin/env bash
NETWORK=hint_nw

image=mrcide/hint-user-cli:mrc-372 #TODO: change to master when merged
docker pull $image
docker run --network=hint_nw $image add-user test.user@example.com password