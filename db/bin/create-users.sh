#!/usr/bin/env bash
set -ex

dropdb -U hint --if-exists modelserver-db
createdb -U hint modelserver-db