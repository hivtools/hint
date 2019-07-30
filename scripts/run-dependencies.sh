#!/usr/bin/env bash
set -ex

NETWORK=hint_nw
CONTAINER=hint_db
docker network create $NETWORK

docker run --rm -d \
  --network=$NETWORK \
  --name $CONTAINER \
  -p 5432:5432 \
  mrcide/hint-db:mrc-371

# From now on, if the user presses Ctrl+C we should teardown gracefully
trap on_interrupt INT
function on_interrupt() {
  docker stop $CONTAINER
  docker network rm $NETWORK
}

# Need to give the database a little time to initialise before we can run the migration
sleep 10s
docker run --rm --network=$NETWORK \
  mrcide/hint-db-migrate:mrc-371 \
  -url=jdbc:postgresql://$CONTAINER/hint
