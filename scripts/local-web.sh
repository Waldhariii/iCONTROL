#!/usr/bin/env bash
set -euo pipefail

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

sleep 2

if command -v open >/dev/null 2>&1; then
  open "http://${HOST}:${PORT}/app/#/login" >/dev/null 2>&1 || true
  open "http://${HOST}:${PORT}/cp/#/login" >/dev/null 2>&1 || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://${HOST}:${PORT}/app/#/login" >/dev/null 2>&1 || true
  xdg-open "http://${HOST}:${PORT}/cp/#/login" >/dev/null 2>&1 || true
fi

wait "$SERVER_PID"
