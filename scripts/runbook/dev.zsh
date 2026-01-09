#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PORT="${1:-5176}"
HOST="127.0.0.1"

echo "=== iCONTROL RUNBOOK: DEV ==="
echo "ROOT=$ROOT"
echo "PORT=$PORT"
echo ""

echo "1) Audit (no-leaks)"
"$ROOT/scripts/audit/audit-no-leaks.zsh" >/dev/null
echo "OK: audit pass"
echo ""

echo "2) Build smoke (fast)"
cd "$ROOT/app"
npm run build >/dev/null
echo "OK: build pass"
echo ""

echo "3) Start dev server (Vite)"
echo "URL: http://$HOST:$PORT/"
npm run dev -- --host "$HOST" --port "$PORT"
