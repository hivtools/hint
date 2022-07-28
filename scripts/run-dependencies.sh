#!/usr/bin/env bash
set -ex

docker network prune -f

HERE=$(realpath "$(dirname $0)")
NETWORK=hint_nw
DB=hint_db
API=hintr
REDIS=hintr_redis
HINTR_VERSION=$(<$HERE/../src/config/hintr_version)

REGISTRY=mrcide
DB_IMAGE=$REGISTRY/hint-db:master
DB_MIGRATE_IMAGE=$REGISTRY/hint-db-migrate:master
HINTR_IMAGE=$REGISTRY/$API:$HINTR_VERSION

export VAULT_ADDR=https://vault.dide.ic.ac.uk:8200
OAUTH2_CLIENT_ID="$(vault read -field=password /secret/oauth2/clientid/auth0)"
OAUTH2_CLIENT_SECRET="$(vault read -field=password /secret/oauth2/clientsecret/auth0)"
OAUTH2_ISSUER_URI="$(vault read -field=password /secret/oauth2/issueruri/auth0)"
OAUTH2_ISSUER_OPENID="$(vault read -field=password /secret/oauth2/scopeopenid/auth0)"
OAUTH2_SCOPE_PROFILE="$(vault read -field=password /secret/oauth2/scopeprofile/auth0)"
OAUTH2_SCOPE_EMAIL="$(vault read -field=password /secret/oauth2/scopeemail/auth0)"

export OAUTH2_CLIENT_ID OAUTH2_CLIENT_SECRET OAUTH2_ISSUER_URI OAUTH2_ISSUER_OPENID OAUTH2_SCOPE_PROFILE OAUTH2_SCOPE_EMAIL

docker network create $NETWORK
docker pull $DB_IMAGE
docker pull $HINTR_IMAGE
docker pull $DB_MIGRATE_IMAGE

docker run --rm -d \
  --network=$NETWORK \
  --name $DB \
  --network-alias db \
  -p 5432:5432 \
  $DB_IMAGE

docker run --rm -d --network=$NETWORK --name $REDIS --network-alias=redis redis

mkdir -p $HERE/../src/app/uploads

docker run --rm -d \
  --network=$NETWORK \
  --name=$API \
  -p 8888:8888 \
  -v $HERE/../src/app/uploads:/uploads \
  -e REDIS_URL=redis://redis:6379 \
  -e USE_MOCK_MODEL=true \
  $HINTR_IMAGE

# Need to give the database a little time to initialise before we can run the migration
docker exec -it $DB wait-for-db
docker run --rm --network=$NETWORK \
  $DB_MIGRATE_IMAGE \
  -url=jdbc:postgresql://$DB/hint

$HERE/add-test-user.sh
