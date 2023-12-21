#!/usr/bin/env bash
set -ex

docker run --rm --network=$NETWORK \
  $DB_MIGRATE_IMAGE \
  -url=jdbc:postgresql://$DB/hint

$HERE/add-test-user.sh