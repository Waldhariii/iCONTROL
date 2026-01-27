#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

HOST="${ICONTROL_LOCAL_HOST:-127.0.0.1}"
PORT="${ICONTROL_LOCAL_PORT:-4176}"
PORT_FILE="${ICONTROL_LOCAL_PORT_FILE:-/tmp/icontrol-local-web.port}"

export ICONTROL_LOCAL_HOST="$HOST"
export ICONTROL_LOCAL_PORT="$PORT"
export ICONTROL_LOCAL_PORT_FILE="${ICONTROL_LOCAL_PORT_FILE:-/tmp/icontrol-local-web.port}"
echo "$ICONTROL_LOCAL_PORT" > "$ICONTROL_LOCAL_PORT_FILE"

"$SCRIPT_DIR/port-guard.sh" || true
if [ -f "$PORT_FILE" ]; then
  PORT="$(cat "$PORT_FILE")"
  export ICONTROL_LOCAL_PORT="$PORT"
fi

echo "ICONTROL_LOCAL_WEB: HOST=${HOST} PORT=${PORT}"

npm run -s local:web:build

SERVER_PID=""
npm run -s local:web:serve &
SERVER_PID=$!

# smoke must use the SSOT port file
"$SCRIPT_DIR/smoke-local-web.sh"

# open both surfaces using SSOT discovery
"$SCRIPT_DIR/open-local-ssot-urls.sh" || true

wait "$SERVER_PID"
