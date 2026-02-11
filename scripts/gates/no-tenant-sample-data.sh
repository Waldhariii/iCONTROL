#!/usr/bin/env bash
set -euo pipefail

# Bloque tokens tenant-specific (exemples). Autorisé uniquement dans:
#   - apps/control-plane/src/ui-v2/mockups/**
#   - docs/**
#   - _backups/**
ALLOW_RE='^(apps/control-plane/src/ui-v2/mockups/|docs/|_backups/)'
SELF_RE='^scripts/gates/no-tenant-sample-data\.sh$'

# Mets ici uniquement des tokens "réels" non génériques. (Pas "Customer A")
PATTERN='Safari Park|J-1042|J-1043|J-1044|Dupont|Bouchard|Longueuil|Laval|Montréal'

RG_OPTS=(--hidden --glob '!**/node_modules/**' --glob '!**/dist/**' -n -S)

hits="$(rg "${RG_OPTS[@]}" -e "$PATTERN" app server scripts runtime 2>/dev/null || true)"
offenders="$(echo "$hits" | awk -F: -v allow="$ALLOW_RE" -v self="$SELF_RE" 'NF>1{file=$1; if (file ~ self) next; if (file !~ allow) print $0;}' || true)"

if [[ -n "${offenders:-}" ]]; then
  echo "[gate][FAIL] tenant-specific sample data leaked outside allowed paths:"
  echo "$offenders"
  exit 1
fi

echo "[gate][OK] no tenant-specific sample data outside allowed paths."
