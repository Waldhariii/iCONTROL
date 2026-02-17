#!/usr/bin/env bash
set -euo pipefail

# DEV Cockpit Runbook V2 — backend gate v7 + CP rewrite (V6) + CI test.
# Log: runtime/reports/DEV_COCKPIT_RUNBOOK_V2_<ts>.log

ROOT="/Users/danygaudreault/iCONTROL"
cd "$ROOT"

TS="$(date -u +%Y%m%d_%H%M%S)"
LOG="runtime/reports/DEV_COCKPIT_RUNBOOK_V2_${TS}.log"
mkdir -p runtime/reports

(
  set -x
  echo "====================================================================="
  echo "DEV COCKPIT RUNBOOK V2"
  echo "ROOT=$ROOT"
  echo "RUN_UTC=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "LOG=$LOG"
  echo "====================================================================="

  echo
  echo "=== 1) Patch CP (V6) so /api/* becomes absolute + ic_dev=1 ==="
  if [ -f scripts/maintenance/dev-cockpit-bypass-v6.sh ]; then
    ./scripts/maintenance/dev-cockpit-bypass-v6.sh || true
  else
    echo "WARN: dev-cockpit-bypass-v6.sh not found; skip CP patch. Run it manually for full cockpit."
  fi

  echo
  echo "=== 2) CI test: cockpit DEV bypass (spawns server, OPTIONS 204, GET 200/401) ==="
  node scripts/ci/test-cockpit-dev-bypass.mjs

  echo
  echo "=== 3) Start API 7070 (loopback) ==="
  pkill -f "node apps/backend-api/server.mjs" 2>/dev/null || true
  sleep 0.5
  OUT="runtime/reports/API_DEV_7070.RUNTIME.${TS}.stdout.log"
  ERR="runtime/reports/API_DEV_7070.RUNTIME.${TS}.stderr.log"
  nohup env PORT=7070 HOST=127.0.0.1 CI=false node apps/backend-api/server.mjs >"$OUT" 2>"$ERR" &
  API_PID=$!
  echo "API_PID=$API_PID"
  sleep 1.2
  curl -fsS "http://127.0.0.1:7070/api/health" >/dev/null && echo "OK: /api/health" || true

  echo
  echo "=== 4) Start CP 5173 ==="
  nohup pnpm -s cp:dev >"runtime/reports/CP_DEV_5173.RUNTIME.${TS}.stdout.log" 2>"runtime/reports/CP_DEV_5173.RUNTIME.${TS}.stderr.log" &
  echo "CP started (pnpm cp:dev)."

  echo
  echo "=== 5) Checklist ==="
  echo "  Terminal A: API already started above (7070)"
  echo "  Terminal B: CP already started above (5173)"
  echo "  1) Open: http://127.0.0.1:5173"
  echo "  2) API Base URL: http://127.0.0.1:7070  (no trailing slash)"
  echo "  3) Refresh"
  echo "  Expected: Health OK, Active Release OK, Gates/Workflows/.../Freeze JSON (no 401)."
  echo
  echo "  Optional: DevTools Console => window.__ic_last_api_rewrite"
  echo
  echo "DONE."
) 2>&1 | tee -a "$LOG"

exit "${PIPESTATUS[0]}"
