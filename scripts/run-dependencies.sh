#!/usr/bin/env bash
set -ex

NETWORK=hint_nw
docker network create $NETWORK

docker run --rm -d \
  --network=$NETWORK \
  --name hint-db \
  mrcide/hint-db:mrc-371

# From now on, if the user presses Ctrl+C we should teardown gracefully
trap on_interrupt INT
function on_interrupt() {
  docker stop hint-db
  docker rm hint-db
  docker network rm $NETWORK
}

# Need to give the database a little time to initialise before we can run the migration
sleep 10s
docker run --rm --network=$NETWORK mrcide/hint-db-migrate:mrc-371

# Wait for Ctrl+C
echo "Ready to use. Press Ctrl+C to teardown."
sleep infinity
