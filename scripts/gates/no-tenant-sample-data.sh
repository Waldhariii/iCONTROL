#!/usr/bin/env bash
set -euo pipefail

ALLOW_RE="^(app/src/ui-v2/mockups/|docs/|_backups/)"
SELF_RE="^scripts/gates/no-tenant-sample-data\.sh$"

# Tenant-specific tokens only (do not include generic placeholders)
PATTERN="Safari Park|J-1042|J-1043|J-1044|Dupont|Bouchard|Montréal|Laval|Longueuil"

hits="$(rg -n --hidden --glob "!**/node_modules/**" --glob "!**/dist/**" --glob "!**/_audit/**" -S -e "$PATTERN" app server scripts runtime 2>/dev/null || true)"

offenders="$(echo "$hits" | awk -F: -v allow="$ALLOW_RE" -v self="$SELF_RE" '
  NF>1 {
    file=$1;
    if (file ~ self) next;
    if (file !~ allow) print $0;
  }' || true)"

if [[ -n "${offenders:-}" ]]; then
  echo "[gate][FAIL] tenant-specific sample data leaked outside mock/docs/_backups:"
  echo "$offenders"
  exit 1
fi

echo "[gate][OK] no tenant-specific sample data outside allowed paths"
