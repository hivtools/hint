#!/usr/bin/env bash
NETWORK=hint_nw

image=mrcide/hint-user-cli:mrc-373 #TODO: change this to master after merge
docker run --network=hint_nw $image add-user test.user@example.com password