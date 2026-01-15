#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-}"
if [[ -z "$PORT" ]]; then
  echo "usage: $0 <port>"
  exit 2
fi

# macOS/Linux: kill whatever listens on PORT
PIDS=$(lsof -tiTCP:"$PORT" -sTCP:LISTEN || true)
if [[ -z "${PIDS}" ]]; then
  echo "OK: nothing listening on ${PORT}"
  exit 0
fi

echo "Killing on port ${PORT}: ${PIDS}"
kill -9 ${PIDS} || true
echo "OK: port ${PORT} freed"
