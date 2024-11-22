#!/usr/bin/env bash
set -e

HERE=$(realpath "$(dirname $0)")

npx tsx "$HERE/collectTranslations.ts"
