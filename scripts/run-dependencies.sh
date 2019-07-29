#!/usr/bin/env bash
docker run --rm -d --network=host --name modelapi_redis redis
docker run --rm -d --network=host --name modelapi_model mrcide/modelapi:latest

./db/scripts/run
