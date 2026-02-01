#!/usr/bin/env bash
set -euo pipefail

echo "[gate][OK] scanning for app/src imports from legacy surfaces"

P1="surfaces"
P2="/_legacy"
PATTERN="${P1}${P2}"

hits="$(rg -n --hidden --glob "!**/node_modules/**" --glob "!**/__tests__/**" -S "from .*${PATTERN}" app/src 2>/dev/null || true)"
if [[ -n "$hits" ]]; then
  echo "$hits"
  echo "[gate][FAIL] legacy surface imports must be zero in prod."
  exit 1
fi

echo "[gate][OK] no legacy surface imports detected in app/src."
