#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Targets: CP core/shared UI only (explicit allowlist)
TARGETS=(
  "$ROOT/app/src/core/ui"
  "$ROOT/modules/core-system/ui/frontend-ts/pages/_shared"
)

# Exclusions: catalog is noisy and intentionally out-of-gate for now
EXCLUDES=(
  "$ROOT/app/src/core/ui/catalog"
)

# Build ripgrep args
RG_ARGS=( -n "style\.cssText\s*=|\.style\.cssText\s*=" )
for ex in "${EXCLUDES[@]}"; do
  RG_ARGS+=( --glob "!${ex#$ROOT/}/**" )
done

# Run
if rg "${RG_ARGS[@]}" "${TARGETS[@]}"; then
  echo ""
  echo "FAIL: inline style.cssText detected in gated UI targets."
  echo "Policy: move styles to CP-scoped classes in STYLE_ADMIN_FINAL.css."
  exit 2
else
  echo "PASS: no inline style.cssText in gated UI targets."
fi
