#!/usr/bin/env bash
set -e

here=$(dirname $0)

echo "Usage: ./generate-types.sh HINTR_BRANCH"
target="src/app/generated.d.ts"
hintr_version=$(<$here/../../../config/hintr_version)
if [[ $# -ne 1 ]] ; then
    echo "No branch provided. Defaulting to $hintr_version"
    branch=$hintr_version
else
    branch=$1
fi

wget https://github.com/mrc-ide/hintr/archive/${branch}.zip
unzip ${branch}

rm ${target} -f
mkdir types
node generateTypes ${branch}

echo "/**
  * This file was automatically generated.
  * DO NOT MODIFY IT BY HAND.
  * Instead, modify the hintr JSON schema files
  * and run ./generate-types.sh to regenerate this file.
*/" >> ${target}

cat types/*.d.ts >> ${target}
rm types -rf
rm ${branch}.zip
rm hintr-${branch} -r
