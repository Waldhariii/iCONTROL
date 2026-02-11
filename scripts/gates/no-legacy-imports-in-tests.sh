#!/usr/bin/env bash
set -euo pipefail

# Tests must not rely on legacy surfaces in prod trajectory.
P1="surfaces"
P2="/_legacy"
PATTERN="${P1}${P2}"

hits="$(rg -n --hidden --glob "!**/node_modules/**" --glob "**/__tests__/**" -S "${PATTERN}" apps/control-plane/src 2>/dev/null || true)"

if [[ -n "${hits:-}" ]]; then
  echo "[gate][FAIL] legacy surface imports in tests still present:"
  echo "$hits"
  exit 1
fi

echo "[gate][OK] no legacy surface imports in tests."
