#!/usr/bin/env bash
set -euo pipefail
RG_OPTS=(--hidden --glob '!**/node_modules/**' --glob '!**/dist/**' -n -S)

hits="$(rg "${RG_OPTS[@]}" -g'*.ts' -g'*.tsx' -e 'ui-v2/mockups' app/src/surfaces 2>/dev/null || true)"
if [[ -n "${hits:-}" ]]; then
  echo "[gate][FAIL] surfaces import mockups (forbidden):"
  echo "$hits"
  exit 1
fi
echo "[gate][OK] surfaces do not import mockups."
