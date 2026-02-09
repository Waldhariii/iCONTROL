#!/bin/bash
set -e

echo "[gate] checking direct writes..."

VIOLATIONS=$(grep -rE "localStorage\.(set|remove)|fetch\([^)]*method.*['\"]POST|axios\.(post|put)" \
  app/src/surfaces \
  --include="*.tsx" --include="*.ts" \
  2>/dev/null | grep -v "// ALLOWED" || true)

if [ -n "$VIOLATIONS" ]; then
  echo "[gate][FAIL] Direct writes:"
  echo "$VIOLATIONS"
  exit 1
fi

echo "[gate][OK] no direct writes"
