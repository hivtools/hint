#!/usr/bin/env bash
docker run --rm -d --network=host --name modelapi_redis redis
docker run --rm -d --network=host --name modelapi_model mrcide/modelapi:latest
docker run --rm -d --network=host --name modelserver_db mrcide/modelserver_db:mrc-371
