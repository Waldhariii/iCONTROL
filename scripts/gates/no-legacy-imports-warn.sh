#!/usr/bin/env bash
set -euo pipefail
echo "[gate][WARN] scanning for app/src imports from surfaces/_legacy (migration debt)"
hits="$(rg -n --hidden --glob "!**/node_modules/**" --glob "!**/__tests__/**" -S "from .*(surfaces/_legacy|/surfaces/_legacy)" app/src 2>/dev/null || true)"
if [[ -n "$hits" ]]; then
  echo "$hits"
  echo "[gate][WARN] legacy imports still present (allowed during migration)."
else
  echo "[gate][OK] no surfaces/_legacy imports detected in app/src."
fi
