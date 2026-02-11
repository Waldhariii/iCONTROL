#!/usr/bin/env zsh
set -euo pipefail
setopt NO_HIST_EXPAND

echo "=== AUDIT: no node:* builtins in client surface (ship code only) ==="

TARGETS=(
  "apps/control-plane/src"
  "modules/core-system/ui/frontend-ts"
)

# Exclude test/spec/mocks from the scan (ship code only)
EXCLUDES=(
  --glob "!**/__tests__/**"
  --glob "!**/*.test.*"
  --glob "!**/*.spec.*"
  --glob "!**/__mocks__/**"
)

# node:* builtins are forbidden in ship code
PATTERN='node:(fs|path|os|crypto|child_process|worker_threads|net|tls|http|https|zlib|stream|buffer|util|url|dns|perf_hooks|vm)'

set +e
# IMPORTANT: options (including --glob) must come BEFORE `--`
rg -n "${EXCLUDES[@]}" -- "$PATTERN" "${TARGETS[@]}"
rc=$?
set -e

if [ "$rc" -eq 0 ]; then
  echo "BLOCKED: found forbidden node:* builtins in ship client surface"
  exit 1
elif [ "$rc" -eq 1 ]; then
  echo "OK: no node:* builtins in ship client surface"
  exit 0
else
  echo "ERROR: rg failed (exit=$rc) -> audit is unreliable, failing hard"
  exit 2
fi
