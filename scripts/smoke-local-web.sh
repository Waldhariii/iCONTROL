#!/usr/bin/env bash
set -euo pipefail

HOST="${ICONTROL_LOCAL_HOST:-127.0.0.1}"
PORT_FILE="${ICONTROL_LOCAL_PORT_FILE:-/tmp/icontrol-local-web.port}"

MAX_WAIT_S="${ICONTROL_SMOKE_MAX_WAIT_S:-20}"
SLEEP_S="${ICONTROL_SMOKE_SLEEP_S:-0.25}"
ATTEMPTS="${ICONTROL_SMOKE_ATTEMPTS:-80}" # ~20s at 0.25s

# Wait for SSOT port file (best-effort)
PORT=""
for _ in $(seq 1 "$ATTEMPTS"); do
  if [ -f "$PORT_FILE" ]; then
    PORT="$(cat "$PORT_FILE" 2>/dev/null | tr -d ' \n\r\t' || true)"
    if [ -n "$PORT" ]; then
      break
    fi
  fi
  sleep "$SLEEP_S"
done

# Fallback if file never appeared
if [ -z "$PORT" ]; then
  PORT="${ICONTROL_LOCAL_PORT:-4176}"
fi

BASE="http://${HOST}:${PORT}"

http_code() {
  local url="$1"
  curl -sS -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000"
}

retry_expect_oneof() {
  local url="$1"; shift
  local expected=("$@")
  local code="000"

  for _ in $(seq 1 "$ATTEMPTS"); do
    code="$(http_code "$url")"
    for e in "${expected[@]}"; do
      if [ "$code" = "$e" ]; then
        echo "OK   $url ($code)"
        return 0
      fi
    done
    sleep "$SLEEP_S"
  done

  echo "FAIL $url ($code expected one of: ${expected[*]})"
  return 1
}

# Surfaces: no slash must redirect; slash must return 200
retry_expect_oneof "$BASE/app" 302
retry_expect_oneof "$BASE/app/" 200
retry_expect_oneof "$BASE/cp" 302
retry_expect_oneof "$BASE/cp/" 200

# APIs must be 200
retry_expect_oneof "$BASE/app/api/runtime-config" 200
retry_expect_oneof "$BASE/cp/api/runtime-config" 200

echo "SMOKE OK (HOST=$HOST PORT=$PORT PORT_FILE=$PORT_FILE)"
