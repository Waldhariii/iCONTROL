#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || exit 1

# Goal: Prevent new ungoverned logging / codes drift.
# Budget0: error codes must match ERR_* / WARN_* / OK / INFO / DEBUG conventions.

BAD=0
OUT="$(mktemp)"
OUT2="$(mktemp)"
trap 'rm -f "$OUT" "$OUT2"' EXIT

# 1) Error code naming convention (heuristic)
rg -n --no-heading --hidden \
  -g '!**/node_modules/**' -g '!**/_artifacts/**' -g '!**/_audit/**' \
  -g '!**/*.node.ts' -g '!**/*.test.ts' -g '!**/*.contract.test.ts' \
  'code["\x27]\s*:\s*["\x27][A-Za-z0-9_:-]+["\x27]' \
  apps core modules scripts 2>/dev/null \
  | rg -v '(OK|INFO|DEBUG|WARN_[A-Z0-9_]+|ERR_[A-Z0-9_]+)["\x27]' \
  | tee "$OUT" || true

if [ -s "$OUT" ]; then
  echo "ERR_OBS_BUDGET0: found non-governed code values (must be ERR_* / WARN_* / OK / INFO / DEBUG)"
  cat "$OUT" | head -20
  BAD=1
fi

# 2) Logger import boundary — fail if app code outside allowed paths imports core/utils/logger
# Allowed: platform/observability, core (owns logger), dev, __tests__
rg -l --no-heading --hidden \
  -g '!**/node_modules/**' -g '!**/_artifacts/**' -g '!**/_audit/**' \
  'from\s+["\x27].*core/utils/logger["\x27]' \
  apps/control-plane/src 2>/dev/null \
  | rg -v '^(apps/control-plane/src/platform/observability/|apps/control-plane/src/core/|apps/control-plane/src/dev/|apps/control-plane/src/__tests__/)' \
  | tee "$OUT2" || true

if [ -s "$OUT2" ]; then
  echo "ERR_OBS_BUDGET0: core/utils/logger imported from disallowed path (use platform/observability/logger)"
  cat "$OUT2" | head -20
  BAD=1
fi

if [ "$BAD" -ne 0 ]; then
  exit 1
fi

echo "OK: gate-observability-budget0 PASS"
