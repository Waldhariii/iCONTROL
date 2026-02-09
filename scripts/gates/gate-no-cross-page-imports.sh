#!/bin/bash
set -e

echo "[gate] checking cross-page imports..."

VIOLATIONS=$(grep -r "from ['\"]\.\./.*/surfaces/" app/src/surfaces \
  --include="*.tsx" --include="*.ts" \
  --exclude-dir="_shared" \
  --exclude-dir="node_modules" \
  2>/dev/null | grep -v "// ALLOWED" || true)

if [ -n "$VIOLATIONS" ]; then
  echo "[gate][FAIL] Cross-page imports:"
  echo "$VIOLATIONS"
  exit 1
fi

echo "[gate][OK] no cross-page imports"
