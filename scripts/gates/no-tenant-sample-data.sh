#!/usr/bin/env bash
set -euo pipefail

# Block tenant-specific sample strings from leaking into core/prod code.
# Allowed: app/src/ui-v2/mockups/**, docs/**, _backups/**
ALLOW_RE='^(app/src/ui-v2/mockups/|docs/|_backups/)'
PATTERN='Safari Park|J-1042|Dupont|Bouchard'

hits="$(rg -n --hidden --glob '!**/node_modules/**' -S -e "$PATTERN" app server scripts runtime 2>/dev/null || true)"

offenders="$(echo "$hits" | awk -F: -v allow="$ALLOW_RE" 'NF>1{file=$1; if (file !~ allow) print $0;}' || true)"

if [[ -n "${offenders:-}" ]]; then
  echo "[gate][FAIL] tenant-specific sample data leaked outside mock/docs:"
  echo "$offenders"
  exit 1
fi

echo "[gate][OK] no tenant-specific sample data outside allowed paths."
