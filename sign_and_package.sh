#!/bin/bash
# Script to pull code signing certificates from external file (not stored with code)
#set -x
CODE_CONFIG=".code_sign.conf"
EXPECTED_VARS=(
  "CSC_LINK" 
  "CSC_KEY_PASSWORD"
  "WIN_CSC_LINK"
  "WIN_CSC_LINK_PASSWORD"
  "APPLE_ID"
  "APPLE_APP_SPECIFIC_PASSWORD"
  "APPLE_TEAM_ID"
);
if [ ! -f "$CODE_CONFIG" ]; then
  echo "Could not locate the code signing configuration (.code_sign.conf), exiting"
  exit 1
fi
source "./$CODE_CONFIG"

IS_DEVEL=0
IS_DEBUG=0

if [ $# -gt 0 ]; then
 if [ "$1" == "devel" ]; then
   IS_DEVEL=1
 elif [ "$1" == "debug" ]; then
   IS_DEBUG=1
 fi
fi

function local_set() {
  if [ $# -ne 1 ]; then
    echo "Internal error: usage: set <variable>"
    exit 1
  fi
  if [ -n "${!1}" ]; then
    echo "Setting environment variable $1"
    export $1
  fi
}
function local_unset() {
  if [ $# -ne 1 ]; then
    echo "Internal error: usage: unset <variable>"
    exit 1
  fi
  if [ -n "${!1}" ]; then
    echo "Unsetting environment variable $1"
    unset $1
  fi
}

for var in "${EXPECTED_VARS[@]}"; do
  local_set $var
done

if [ $IS_DEVEL -eq 1 ]; then
  echo "npx electron-builder build --mac --win --publish never"
  npx electron-builder build --mac --win --publish never
elif [ $IS_DEBUG -eq 1 ]; then
  echo "DEBUG_PROD=true npm run package-all"
  DEBUG_PROD=true npm run package-all
else
  echo "npm run package-all"
  npm run package-all
fi

for var in "${EXPECTED_VARS[@]}"; do
  local_unset $var
done
