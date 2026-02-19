#!/usr/bin/env bash
set -euo pipefail

# ================================
# iCONTROL — core-billing triage pack
# ================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="${ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
TS="$(date -u +%Y%m%d_%H%M%S)"
REPORT="${ROOT}/runtime/reports/DIAG_CORE_BILLING_${TS}.log"
DIAG_SCRIPT="${SCRIPT_DIR}/diagnose-missing-core-billing.sh"

cd "$ROOT"
mkdir -p "$(dirname "$REPORT")"

echo "=== 0) Preflight ===" | tee "$REPORT"
git status -sb | tee -a "$REPORT" || true
echo "origin=$(git remote get-url origin 2>/dev/null || echo '(missing)')" | tee -a "$REPORT"
echo "HEAD=$(git rev-parse --short HEAD 2>/dev/null || true)" | tee -a "$REPORT"
echo | tee -a "$REPORT"

echo "=== 1) Run official diagnostic script (read-only) ===" | tee -a "$REPORT"
if [ ! -x "$DIAG_SCRIPT" ]; then
  echo "ERR: script missing or not executable: $DIAG_SCRIPT" | tee -a "$REPORT"
  exit 2
fi
bash "$DIAG_SCRIPT" 2>&1 | tee -a "$REPORT" || true
echo | tee -a "$REPORT"

echo "=== 2) Fast signals (A/B/C decision helpers) ===" | tee -a "$REPORT"

APP_MAIN="$ROOT/apps/control-plane/src/main.ts"
if [ -f "$APP_MAIN" ]; then
  echo "--- main.ts imports around @modules/core-billing ---" | tee -a "$REPORT"
  nl -ba "$APP_MAIN" | sed -n '1,160p' | tee -a "$REPORT" >/dev/null || true
  echo | tee -a "$REPORT"
else
  echo "WARN: main.ts not found at: $APP_MAIN" | tee -a "$REPORT"
fi

echo "--- Find ANY @modules usage (top 80) ---" | tee -a "$REPORT"
grep -RIn --exclude-dir=node_modules --exclude-dir=.git -E "from ['\"]@modules/|import ['\"]@modules/" "$ROOT" 2>/dev/null \
  | head -80 | tee -a "$REPORT" || true
echo | tee -a "$REPORT"

echo "--- Find BillingService / BILLING_CONF references (top 120) ---" | tee -a "$REPORT"
grep -RIn --exclude-dir=node_modules --exclude-dir=.git -E "BillingService|BILLING_CONF|core-billing" "$ROOT" 2>/dev/null \
  | head -120 | tee -a "$REPORT" || true
echo | tee -a "$REPORT"

echo "--- Git blame: when @modules/core-billing was introduced (if present) ---" | tee -a "$REPORT"
if [ -f "$APP_MAIN" ]; then
  git log -S"@modules/core-billing" --oneline -n 30 -- "$APP_MAIN" 2>/dev/null | tee -a "$REPORT" || true
fi
echo | tee -a "$REPORT"

echo "=== 3) Output ===" | tee -a "$REPORT"
echo "REPORT=$REPORT"
echo
echo "NEXT (for Cursor): copy/paste these sections from the report:"
echo "  - Find ANY @modules usage"
echo "  - Find BillingService / BILLING_CONF references"
echo "  - Git log -S\"@modules/core-billing\""
echo
echo "DONE."
