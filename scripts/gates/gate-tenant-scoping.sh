#!/bin/bash
set -e

echo "[gate] checking tenant scoping..."

MISSING=()

for page in app/src/surfaces/cp/*/Page.tsx app/src/surfaces/app/*/Page.tsx; do
  if [ ! -f "$page" ]; then continue; fi

  if ! grep -q "useTenantContext\|tenantId" "$page"; then
    MISSING+=("$page")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "[gate][FAIL] Missing tenant scoping:"
  printf '%s\n' "${MISSING[@]}"
  exit 1
fi

echo "[gate][OK] tenant scoping OK"
