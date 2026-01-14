#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-origin/main...HEAD}"

# Collect changed files (Added/Copied/Modified/Renamed)
FILES="$(git diff --name-only --diff-filter=ACMR "$BASE" || true)"

# Filter to prettier-relevant extensions & exclude disabled/lock/build artifacts
FILTERED="$(printf "%s\n" "$FILES" | rg -N '\.(ts|tsx|js|jsx|json|md|yml|yaml|css|scss|html)$' \
  | rg -v -N '(\.ts\.disabled|\.tsx\.disabled|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|node_modules/|dist/|build/|coverage/|\.next/|out/|\.vite/)' || true)"

if [ -z "${FILTERED}" ]; then
  echo "OK: no changed files require prettier check for range: $BASE"
  exit 0
fi

echo "Prettier diff-check range: $BASE"
echo "$FILTERED" | sed 's/^/ - /'

# Run prettier check on just the changed files
npx prettier --check $(printf "%s\n" "$FILTERED")
