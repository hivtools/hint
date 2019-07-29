#!/usr/bin/env bash
set -ex

dropdb -U naomi --if-exists modelserver-db
createdb -U naomi modelserver-db