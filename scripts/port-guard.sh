#!/usr/bin/env bash
set -euo pipefail
PORT="${ICONTROL_LOCAL_PORT:-4176}"
if lsof -i TCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "ERR_PORT_IN_USE: Port $PORT already in use"
  exit 1
fi
