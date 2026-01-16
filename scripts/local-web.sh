#!/usr/bin/env bash
set -euo pipefail

# ICONTROL_LOCAL_WEB_GUARD_V1
"20 20 12 61 79 80 81 701 33 98 100 204 250 395 398 399 400 702dirname "-e")/port-guard.sh"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

HOST="${ICONTROL_LOCAL_HOST:-127.0.0.1}"
PORT="${ICONTROL_LOCAL_PORT:-4176}"
DIST="./dist"

npm run local:web:build

export ICONTROL_LOCAL_HOST="$HOST"
export ICONTROL_LOCAL_PORT="$PORT"

npm run local:web:serve &
SERVER_PID=$!

# ICONTROL_LOCAL_WEB_SMOKE_V1
"20 20 12 61 79 80 81 701 33 98 100 204 250 395 398 399 400 702dirname "-e")/smoke-local-web.sh" || true

sleep 2

if command -v open >/dev/null 2>&1; then
  open "http://${HOST}:${PORT}/app/#/login" >/dev/null 2>&1 || true
  open "http://${HOST}:${PORT}/cp/#/login" >/dev/null 2>&1 || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://${HOST}:${PORT}/app/#/login" >/dev/null 2>&1 || true
  xdg-open "http://${HOST}:${PORT}/cp/#/login" >/dev/null 2>&1 || true
fi

wait "$SERVER_PID"
