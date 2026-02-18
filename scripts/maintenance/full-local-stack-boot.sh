#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="${ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
API_DIR="$ROOT/platform/api"
CP_DIR="$ROOT/apps/control-plane"

echo "=================================================="
echo "iCONTROL — FULL LOCAL STACK BOOT"
echo "API : 7070"
echo "CP  : 5173"
echo "ROOT: $ROOT"
echo "=================================================="

cd "$ROOT"

# Kill children on script exit (e.g. Ctrl+C)
cleanup() {
  echo
  echo "Shutting down..."
  kill ${API_PID:-} 2>/dev/null || true
  kill ${CP_PID:-} 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo
echo "=== 0) Kill ports (anti-collision) ==="
lsof -ti:7070 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
pkill -f vite 2>/dev/null || true

echo
echo "=== 1) Install workspace deps ==="
pnpm install

##################################################
# API
##################################################

echo
echo "=== 2) Build API if needed ==="
cd "$API_DIR"

if [ ! -f dist/index.js ]; then
  echo "dist missing -> building API"
  pnpm run build
fi

echo
echo "=== 3) Start API (7070) ==="

PORT=7070 node dist/index.js &
API_PID=$!

sleep 2

if ! lsof -i:7070 >/dev/null 2>&1; then
  echo "❌ API failed to start on 7070"
  exit 1
fi

echo "✅ API running → http://localhost:7070"

##################################################
# CONTROL PLANE
##################################################

echo
echo "=== 4) Start Control Plane (5173 strict) ==="
cd "$CP_DIR"

# Vite uses --port, not PORT env; CONTROL_PLANE for cockpit surface
VITE_APP_KIND=CONTROL_PLANE pnpm dev &
CP_PID=$!

sleep 3

if ! lsof -i:5173 >/dev/null 2>&1; then
  echo "❌ CP failed to start on 5173"
  exit 1
fi

echo "✅ CP running → http://localhost:5173/cp/"

echo
echo "=================================================="
echo "STACK READY"
echo "API → http://localhost:7070"
echo "CP  → http://localhost:5173/cp/"
echo "=================================================="

wait
