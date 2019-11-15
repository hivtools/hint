#!/usr/bin/env bash
NETWORK=hint_nw

image=mrcide/hint-user-cli:master
docker pull $image
docker run --network=hint_nw $image add-user test.user@example.com password
