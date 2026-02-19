#!/bin/bash
set -e

echo "[gate] checking direct writes..."

VIOLATIONS=$(grep -rE "localStorage\.(set|remove)|sessionStorage\.(set|remove)" \
  apps/control-plane/src/surfaces/cp \
  --include="*.tsx" --include="*.ts" \
  2>/dev/null | grep -v "// ALLOWED" || true)

if [ -n "$VIOLATIONS" ]; then
  echo "[gate][FAIL] Direct writes:"
  echo "$VIOLATIONS"
  exit 1
fi

echo "[gate][OK] no direct writes"
