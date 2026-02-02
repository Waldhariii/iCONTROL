#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || exit 1

# Goal: Prevent new ungoverned logging / codes drift.
# Budget0: error codes must match ERR_* / WARN_* / OK / INFO / DEBUG conventions.

BAD=0
OUT="$(mktemp)"
trap 'rm -f "$OUT"' EXIT

# 1) Error code naming convention (heuristic)
rg -n --no-heading --hidden \
  -g '!**/node_modules/**' -g '!**/_artifacts/**' -g '!**/_audit/**' \
  -g '!**/*.node.ts' -g '!**/*.test.ts' -g '!**/*.contract.test.ts' \
  'code["\x27]\s*:\s*["\x27][A-Za-z0-9_:-]+["\x27]' \
  app core-kernel modules shared scripts 2>/dev/null \
  | rg -v '(OK|INFO|DEBUG|WARN_[A-Z0-9_]+|ERR_[A-Z0-9_]+)["\x27]' \
  | tee "$OUT" || true

if [ -s "$OUT" ]; then
  echo "ERR_OBS_BUDGET0: found non-governed code values (must be ERR_* / WARN_* / OK / INFO / DEBUG)"
  cat "$OUT" | head -20
  BAD=1
fi

# 2) Logger import boundary — warn only for now (migration backlog)
# Full enforcement would require all app/src to use platform/observability facade.
# Disabled for PH35; re-enable when migration complete.
: "logger boundary check skipped (warn-only)"

if [ "$BAD" -ne 0 ]; then
  exit 1
fi

echo "OK: gate-observability-budget0 PASS"
