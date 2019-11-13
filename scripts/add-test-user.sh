#!/usr/bin/env bash
NETWORK=hint_nw

image=mrcide/hint-user-cli:master
docker pull $image
docker run -e db_url="jdbc:postgresql://db/hint" --network=hint_nw $image add-user test.user@example.com password
