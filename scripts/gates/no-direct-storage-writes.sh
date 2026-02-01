#!/usr/bin/env bash
set -euo pipefail

# Allow platform storage/write-gateway and existing core/dev/test legacy usages (to be migrated).
ALLOW_RE='^(app/src/platform/(storage|write-gateway)/|app/src/core/|app/src/dev/|app/src/__tests__/)'
# Block direct localStorage usage anywhere else (prod hygiene)
hits="$(rg -n --hidden --glob '!**/node_modules/**' -S -e '\blocalStorage\.(setItem|getItem|removeItem|clear)\b' app/src 2>/dev/null || true)"
offenders="$(echo "$hits" | awk -F: -v allow="$ALLOW_RE" 'NF>1{file=$1; if (file !~ allow) print $0;}' || true)"

if [[ -n "${offenders:-}" ]]; then
  echo "[gate][FAIL] direct localStorage writes outside platform storage/write-gateway:"
  echo "$offenders"
  exit 1
fi

echo "[gate][OK] no direct localStorage writes outside platform."
