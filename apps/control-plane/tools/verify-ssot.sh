#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-full}" # full | fast
TS="$(date +"%Y%m%d_%H%M%S")"
AUD="_audit"
mkdir -p "$AUD"

MODE_UP="$(printf "%s" "$MODE" | tr '[:lower:]' '[:upper:]')"
LOG="$AUD/VERIFY_SSOT_${MODE_UP}_${TS}.log"

log(){ echo "[$(date +"%H:%M:%S")] $*" | tee -a "$LOG"; }
fail(){ log "FAIL: $*"; log "Evidence: $LOG"; exit "${2:-1}"; }

log "verify:ssot mode=$MODE"
log "workspace=$(pwd)"
log "ts=$TS"
log "--- GOVERNANCE SCANS ---"

command -v rg >/dev/null 2>&1 || fail "rg not found (brew install ripgrep)" 10

# 1) window.navigate forbidden (any hit is failure)
if rg -n --no-ignore --hidden -S "window\.navigate\(" src | tee -a "$LOG"; then
  fail "window.navigate found" 2
fi

# 2) direct location.hash writes forbidden outside navigate gateway + tests
if rg -n --no-ignore --hidden -S "location\.hash\s*=|window\.location\.hash\s*=" src \
  | rg -v "src/runtime/navigate\.ts|__tests__" \
  | rg -v "__LOGS_ROUTE_GREP_ONLY__|ICONTROL_LOGS_ROUTE_CHECK_V2" \
  | tee -a "$LOG"; then
  fail "direct location.hash write found outside gateway/tests" 3
fi

# 3) mount write gateway unique (exactly 1 in src/main.ts)
CNT="$(rg -n --no-ignore --hidden -S "__ICONTROL_MOUNT__\s*=" src/main.ts | wc -l | tr -d " ")"
log "__ICONTROL_MOUNT__ writes in src/main.ts: $CNT"
[[ "$CNT" == "1" ]] || fail "expected exactly 1 __ICONTROL_MOUNT__ write in src/main.ts" 4

# 4) router mount SSOT marker + mount-first return
rg -n --no-ignore --hidden -S "ICONTROL_MOUNT_TARGET_V1" src/router.ts >>"$LOG" || fail "router mount SSOT marker missing" 5
rg -n --no-ignore --hidden -S "return mount \|\| cxMain \|\| app \|\| document\.body" src/router.ts >>"$LOG" || fail "router mount-first return missing" 6

# 5) vite env resolution loadEnv/rawAppKind
rg -n --no-ignore --hidden -S "loadEnv\(|rawAppKind\s*=" vite.config.ts >>"$LOG" || fail "vite loadEnv/rawAppKind missing" 7

log "--- GOVERNANCE SCANS: PASS ---"

if [[ "$MODE" == "fast" ]]; then
  log "PASS: verify:ssot:fast"
  log "Evidence: $LOG"
  exit 0
fi

log "--- TESTS ---"
npm test | tee -a "$LOG"
log "PASS: verify:ssot"
log "Evidence: $LOG"
