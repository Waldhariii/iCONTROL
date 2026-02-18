#!/bin/bash
set -e

echo "[gate] checking inline styles..."

VIOLATIONS=$(grep -r "style={{" apps/control-plane/src/surfaces/cp \
  --include="*.tsx" \
  2>/dev/null | grep -v "// ALLOWED" || true)

if [ -n "$VIOLATIONS" ]; then
  echo "[gate][FAIL] Inline styles:"
  echo "$VIOLATIONS"
  exit 1
fi

echo "[gate][OK] no inline styles"
