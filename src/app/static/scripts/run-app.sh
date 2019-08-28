#!/usr/bin/env bash

set -ex

HERE=$(dirname $0)
NETWORK=hint_nw
DB=hint_db
API=hintr
HINT=hint
HINTR_VERSION=$(<$HERE/../../config/hintr_version)
HINT_VERSION=master

REGISTRY=mrcide
DB_IMAGE=$REGISTRY/hint-db:master
DB_MIGRATE_IMAGE=$REGISTRY/hint-db-migrate:master
HINTR_IMAGE=$REGISTRY/$API:$HINTR_VERSION
HINT_IMAGE=$REGISTRY/$HINT:$HINT_VERSION

docker network create $NETWORK
docker pull $DB_IMAGE
docker pull $HINTR_IMAGE
docker pull $DB_MIGRATE_IMAGE

docker run --rm -d \
  --network=$NETWORK \
  --name $DB \
  $DB_IMAGE

docker run --rm -d \
  --network=$NETWORK \
  --name=$API \
  $HINTR_IMAGE

docker run --rm -d \
  --network=$NETWORK \
  --name $HINT \
  -p 8080:8080 \
  $HINT_IMAGE

# From now on, if the user presses Ctrl+C we should teardown gracefully
trap cleanup INT
function cleanup() {
  docker stop $DB
  docker stop $API
  docker stop $HINT
  docker network rm $NETWORK
}

# Wait for Ctrl+C
echo "Ready to use. Press Ctrl+C to teardown."
sleep infinity
