#!/usr/bin/env bash
set -euo pipefail

hits=$(rg -n "from ['\"]@?/?.*surfaces/.*/.*surfaces/" apps/control-plane/src 2>/dev/null || true)

if [[ -n "$hits" ]]; then
  echo "[gate][FAIL] cross-surface imports detected:"
  echo "$hits"
  exit 1
fi

echo "[gate][OK] no cross-surface imports."
