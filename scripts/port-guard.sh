#!/usr/bin/env bash
set -euo pipefail

# Returns:
#  0 -> port libre et utilisable (ou deja libre)
#  2 -> port deja en use, un autre port a ete selectionne
#  1 -> aucun port disponible
HOST="${ICONTROL_LOCAL_HOST:-127.0.0.1}"
PORT="${ICONTROL_LOCAL_PORT:-4176}"
OUT_FILE="${ICONTROL_LOCAL_PORT_FILE:-/tmp/icontrol-local-web.port}"

is_free() {
  local p="$1"
  python3 - <<PY
import socket, sys
host="${HOST}"
p=int("${p}")
s=socket.socket()
try:
  s.bind((host,p))
  s.close()
  sys.exit(0)
except OSError:
  try: s.close()
  except: pass
  sys.exit(1)
PY
}

if is_free "$PORT"; then
  echo "$PORT" > "$OUT_FILE"
  echo "PORT_OK: $PORT"
  exit 0
fi

echo "WARN_PORT_IN_USE: Port $PORT in use -> selecting another"

# pick next free port in a small range
for p in $(seq $((PORT+1)) $((PORT+50))); do
  if is_free "$p"; then
    echo "$p" > "$OUT_FILE"
    echo "PORT_SELECTED: $p"
    exit 2
  fi
done

echo "ERR_NO_FREE_PORT: range exhausted" >&2
exit 1
