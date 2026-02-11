#!/usr/bin/env bash
set -euo pipefail

HITS="$(rg -n --hidden --glob "!**/node_modules/**" --glob "!**/_backups/**" -S \
  -e "from[[:space:]]+[\"'\'' ]\\./pages/" \
  -e "from[[:space:]]+[\"'\'' ]\\.\\./pages/" \
  apps/control-plane/src 2>/dev/null || true)"

# Exclude tests
HITS="$(echo "$HITS" | rg -v "__tests__/" || true)"

if [[ -n "${HITS:-}" ]]; then
  echo "[gate][FAIL] direct pages/** imports still present in apps/control-plane/src:"
  echo "$HITS"
  exit 1
fi

echo "[gate][OK] no direct pages/** imports in apps/control-plane/src."
