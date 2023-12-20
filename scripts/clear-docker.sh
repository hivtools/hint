#!/usr/bin/env bash
containers=$(docker ps -a -q)
for container in $containers
do
  docker kill $container;
  docker rm $container;
done

docker network prune --force || true
exit 0
