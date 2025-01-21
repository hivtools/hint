#!/usr/bin/env bash
set -ex

docker network prune -f

HERE=$(realpath "$(dirname $0)")
NETWORK=hint_nw
DB=hint_db
API=hintr
REDIS=hintr_redis
HINTR_VERSION=$(<$HERE/../src/config/hintr_version)

GHCR=ghcr.io/hivtools
DB_IMAGE=$GHCR/hint-db:main
DB_MIGRATE_IMAGE=$GHCR/hint-db-migrate:main
HINTR_IMAGE=$GHCR/$API:$HINTR_VERSION
REDIS_SRC=ghcr.io/mrc-ide/docker-official-images/redis:6

docker network create $NETWORK
docker pull $DB_IMAGE
docker pull $HINTR_IMAGE
docker pull $DB_MIGRATE_IMAGE
docker pull $REDIS_SRC

docker run --rm -d \
  --network=$NETWORK \
  --name $DB \
  --network-alias db \
  -p 5432:5432 \
  $DB_IMAGE

docker run --rm -d --network=$NETWORK --name $REDIS --network-alias=redis $REDIS_SRC

mkdir -p $HERE/../src/app/uploads
mkdir -p $HERE/../src/app/results

docker run --rm -d \
  --network=$NETWORK \
  --name=$API \
  -p 8888:8888 \
  -v $HERE/../src/app/uploads:/uploads \
  -v $HERE/../src/app/results:/results \
  -e REDIS_URL=redis://redis:6379 \
  -e USE_MOCK_MODEL=true \
  $HINTR_IMAGE \
  --results-dir=/results \
  --inputs-dir=/uploads

# Need to give the database a little time to initialise before we can run the migration
docker exec -i $DB wait-for-db
docker run --rm --network=$NETWORK \
  $DB_MIGRATE_IMAGE \
  -url=jdbc:postgresql://$DB/hint

$HERE/add-test-user.sh
$HERE/add-support-user.sh
