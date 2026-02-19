#!/usr/bin/env bash
set -euo pipefail

# ==================================================
# iCONTROL — Diagnose missing @modules/core-billing
# Goal: identify WHY the import exists, WHERE billing code should come from,
#       and propose the cleanest remediation path (A/B/C).
# ==================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="${ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
APP="$ROOT/apps/control-plane"
MAIN="$APP/src/main.ts"

echo "=================================================="
echo "DIAGNOSE: Missing @modules/core-billing"
echo "ROOT=$ROOT"
echo "APP=$APP"
echo "=================================================="
echo

cd "$ROOT"

echo "=== 0) Repo identity ==="
git status -sb || true
echo "BRANCH=$(git branch --show-current 2>/dev/null || true)"
echo "HEAD=$(git rev-parse --short HEAD 2>/dev/null || true)"
echo "origin=$(git remote get-url origin 2>/dev/null || echo '(missing)')"
echo

echo "=== 1) Show failing import context (main.ts) ==="
if [ -f "$MAIN" ]; then
  echo "--- $MAIN (top 120 lines) ---"
  nl -ba "$MAIN" | sed -n '1,140p' || true
else
  echo "ERR: $MAIN not found"
  exit 2
fi
echo

echo "=== 2) Search for '@modules/' usage (who expects modules alias?) ==="
grep -RIn --exclude-dir=node_modules --exclude-dir=.git \
  -E "from ['\"]@modules/|import ['\"]@modules/" \
  "$ROOT" 2>/dev/null | head -200 || true
echo

echo "=== 3) Search for core-billing symbol usage (BillingService etc.) ==="
grep -RIn --exclude-dir=node_modules --exclude-dir=.git \
  -E "BillingService|BILLING_CONF|core-billing|core_billing|billing.*service" \
  "$ROOT" 2>/dev/null | head -240 || true
echo

echo "=== 4) Truth test: is 'core-billing' present anywhere? ==="
FOUND_DIRS="$(find "$ROOT" -path "$ROOT/.git" -prune -o -path "$ROOT/node_modules" -prune -o -type d -name "core-billing" -print 2>/dev/null | head -20 || true)"
FOUND_FILES="$(find "$ROOT" -path "$ROOT/.git" -prune -o -path "$ROOT/node_modules" -prune -o -type f -iname "*core-billing*" -print 2>/dev/null | head -20 || true)"
if [ -n "${FOUND_DIRS}${FOUND_FILES}" ]; then
  echo "FOUND:"
  echo "$FOUND_DIRS"
  echo "$FOUND_FILES"
else
  echo "OK: no core-billing found in this workspace."
fi
echo

echo "=== 5) Check whether repo has a 'modules' workspace or package that should contain it ==="
echo "--- top-level modules dir ---"
ls -la "$ROOT/modules" 2>/dev/null || echo "(no $ROOT/modules)"
echo
echo "--- search for packages named core-billing in package.json ---"
grep -RIn --exclude-dir=node_modules --exclude-dir=.git \
  -E "\"name\"\s*:\s*\"(@[^/]+/)?core-billing\"" \
  "$ROOT" 2>/dev/null | head -80 || true
echo

echo "=== 6) Check Vite + TS alias configuration (for @modules) ==="
VITE_CFG="$APP/vite.config.ts"
if [ -f "$VITE_CFG" ]; then
  echo "--- vite.config.ts snippets ---"
  grep -nE "resolve|alias|@modules" "$VITE_CFG" 2>/dev/null | head -120 || true
else
  echo "WARN: $VITE_CFG not found"
fi
echo

echo "--- tsconfig path mappings ---"
for f in "$APP/tsconfig.json" "$ROOT/tsconfig.paths.json" "$ROOT/tsconfig.base.json" "$ROOT/tsconfig.json"; do
  if [ -f "$f" ]; then
    echo "FILE=$f"
    grep -nE "\"paths\"|@modules" "$f" 2>/dev/null | head -120 || true
    echo
  fi
done

echo "=== 7) Git history: when was @modules/core-billing introduced? ==="
git log --oneline -n 30 -- "$MAIN" 2>/dev/null || true
echo
echo "--- grep history for the exact string ---"
git log -S"@modules/core-billing" --oneline -n 20 -- "$MAIN" 2>/dev/null || true
echo

echo "=== 8) Action decision (A/B/C) ==="
echo "A) If another branch has core-billing -> cherry-pick/merge that module into this branch."
echo "B) If billing exists elsewhere -> replace import to the real location (no ghost module)."
echo "C) If billing is optional -> guard it behind runtime flag and remove hard import."
echo
echo "NEXT: paste the outputs of sections 2, 3, and 7 here (or give them to Cursor)."
echo "=================================================="
echo "DONE."
