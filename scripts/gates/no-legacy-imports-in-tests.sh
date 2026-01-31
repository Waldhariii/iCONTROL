#!/usr/bin/env bash
set -euo pipefail

# Tests must not rely on surfaces/_legacy in prod trajectory.
# Strict in prod: FAIL if any remain.
hits="$(rg -n --hidden --glob "!**/node_modules/**" --glob "**/__tests__/**" -S "surfaces/_legacy" app/src 2>/dev/null || true)"

if [[ -n "${hits:-}" ]]; then
  echo "[gate][FAIL] legacy imports in tests still present:"
  echo "$hits"
  exit 1
fi

echo "[gate][OK] no legacy imports in tests."
