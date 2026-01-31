#!/usr/bin/env bash
set -euo pipefail
echo "[gate][OK] scanning for app/src imports from surfaces/_legacy"
hits="$(rg -n --hidden --glob "!**/node_modules/**" --glob "!**/__tests__/**" -S "from .*(surfaces/_legacy|/surfaces/_legacy)" app/src 2>/dev/null || true)"
if [[ -n "$hits" ]]; then
  echo "$hits"
  echo "[gate][FAIL] legacy imports must be zero in prod."
  exit 1
fi

echo "[gate][OK] no surfaces/_legacy imports detected in app/src."
