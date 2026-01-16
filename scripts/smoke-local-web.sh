#!/usr/bin/env bash
set -euo pipefail
HOST="${ICONTROL_LOCAL_HOST:-127.0.0.1}"
PORT="${ICONTROL_LOCAL_PORT:-4176}"
BASE="http://${HOST}:${PORT}"

check() {
  local url="$1"
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$code" != "200" ]; then
    echo "FAIL $url ($code)"; exit 1
  fi
  echo "OK   $url"
}

check "$BASE/app/#/login"
check "$BASE/cp/#/login"
echo "SMOKE OK"
