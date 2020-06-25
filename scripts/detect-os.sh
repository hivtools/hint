#!/usr/bin/env bash

OS_TYPE=$(uname)
PATH_TYPE=''

if [[ "$OS_TYPE" == "linux"* ]]; then
  PATH_TYPE='readlink -f'
else
  PATH_TYPE='realpath'
fi

export PATH_TYPE