#!/usr/bin/env zsh
set -euo pipefail

echo "=== AUDIT: no node:* builtins in client surface (ship code only) ==="

# Ship surface: app/src runtime + UI pages that can be pulled into browser bundles.
# Exclusions: tests/specs/mocks are allowed to use node:*.
TARGETS=(
  "app/src"
  "modules/core-system/ui/frontend-ts"
)

# ripgrep globs: exclude any tests/specs and mock scaffolding.
EXCLUDES=(
  "--glob" "!**/__tests__/**"
  "--glob" "!**/*.test.*"
  "--glob" "!**/*.spec.*"
  "--glob" "!**/__mocks__/**"
)

# node:* builtins are forbidden in ship code
PATTERN='node:(fs|path|os|crypto|child_process|worker_threads|net|tls|http|https|zlib|stream|buffer|util|url|dns|perf_hooks|vm)'

if rg -n -- "$PATTERN" "${EXCLUDES[@]}" "${TARGETS[@]}"; then
  echo "BLOCKED: found forbidden node:* builtins in ship client surface"
  exit 1
else
  echo "OK: no node:* builtins in ship client surface"
fi
