#!/usr/bin/env bash
docker run --rm -d --network=host --name modelapi_redis redis
docker run --rm -d --network=host --name modelapi_model mrcide/modelapi:latest

docker run --rm -d --network=host --name hint-db mrcide/hint-db:mrc-371

# Need to give the database a little time to initialise before we can run the migration
sleep 10s
docker run --rm --network=host --name hint-db-migrate mrcide/hint-db-migrate:mrc-371 -url=jdbc:postgresql://localhost/hint
