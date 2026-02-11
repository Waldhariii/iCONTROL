#!/usr/bin/env bash
set -e

echo "[gate] pressure-layer"

# Exclude: test setup, tests, node-only, tools, audit docs, schema, kernel-allowed (platform/core/dev)
violations=$(rg -n \
  "localStorage|sessionStorage|fs\.writeFile|writeFileSync" \
  app modules server \
  --glob '!**/vitest.setup.ts' \
  --glob '!**/*.test.ts' \
  --glob '!**/__tests__/**' \
  --glob '!**/*.node.ts' \
  --glob '!**/tools/**' \
  --glob '!**/_AUDIT_*' \
  --glob '!**/*.schema.json' \
  --glob '!**/mainSystem.data.ts' \
  --glob '!apps/control-plane/src/platform/**' \
  --glob '!apps/control-plane/src/core/**' \
  --glob '!apps/control-plane/src/dev/**' \
  2>/dev/null || true)

if [[ -n "$violations" ]]; then
  echo "WARN_PRESSURE_BYPASS: direct storage/write usage (migration backlog):"
  echo "$violations" | head -20
  if [[ "$(echo "$violations" | wc -l)" -gt 20 ]]; then
    echo "... and more (warn-only for now)"
  fi
  # Phase 30: strict by default; set PRESSURE_LAYER_STRICT=0 to warn-only
  if [[ "${PRESSURE_LAYER_STRICT:-1}" = "1" ]]; then
    echo "ERR_PRESSURE_BYPASS (STRICT)"
    exit 1
  fi
  echo "[gate][WARN] pressure-layer — violations logged, non-blocking"
else
  echo "[gate][OK] pressure-layer"
fi
