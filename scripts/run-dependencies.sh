#!/usr/bin/env bash
set -ex

NETWORK=hint_nw
DB=hint_db
API=hintr

REGISTRY=mrcide
DB_IMAGE=$REGISTRY/hint-db:master
DB_MIGRATE_IMAGE=$REGISTRY/hint-db-migrate:latest
HINTR_IMAGE=$REGISTRY/$API:mrc-418

docker network create $NETWORK
docker pull $DB_IMAGE
docker pull $HINTR_IMAGE
docker pull $DB_MIGRATE_IMAGE

docker run --rm -d \
  --network=$NETWORK \
  --name $DB \
  -p 5432:5432 \
  $DB_IMAGE

docker run --rm -d \
  --network=$NETWORK \
  --name=$API \
  -p 8888:8888 \
  $HINTR_IMAGE


# Need to give the database a little time to initialise before we can run the migration
sleep 10s
docker run --rm --network=$NETWORK \
  $DB_MIGRATE_IMAGE \
  -url=jdbc:postgresql://$DB/hint

HERE=$(dirname "$0")
"$HERE"/add-test-user.sh


