#!/usr/bin/env bash
set -euo pipefail

# Fail if any runtime/prod code references apps/control-plane/src/pages (legacy) after migration.
# Allowed: _backups/**, docs/**, audit/evidence, tests, and scripts
ALLOW_RE='^(_backups/|docs/|_audit/|app/_audit_runs/|app/_AUDIT|app/_audit/|app/_EVIDENCE_STORE/|app/console_usages_report\.txt|app/\.eslintignore$|scripts/|apps/control-plane/src/__tests__/|apps/control-plane/src/.*__tests__/|.*\.test\.|PATHS_CANONICAL\.md$|\.)'
PATTERN='apps/control-plane/src/pages/|from\s+["'"'"']\./pages/|from\s+["'"'"']\.\./pages/|/pages/(app|cp)/|src/pages/(app|cp)/'

# Scan repo (fast). Exclude node_modules and dist.
hits="$(rg -n --hidden --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/.git/**' -S -e "$PATTERN" . 2>/dev/null || true)"

offenders="$(echo "$hits" | awk -F: -v allow="$ALLOW_RE" 'NF>1{file=$1; if (file !~ allow) print $0;}' || true)"

if [[ -n "${offenders:-}" ]]; then
  echo "[gate][FAIL] legacy pages dependency detected outside allowed paths:"
  echo "$offenders"
  exit 1
fi

echo "[gate][OK] no surfaces baseline deps outside allowed paths."
