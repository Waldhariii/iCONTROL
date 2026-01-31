#!/usr/bin/env bash
set -euo pipefail

ALLOW_RE='^app/src/surfaces/_legacy/'
HITS="$(rg -n --hidden --glob "!**/node_modules/**" --glob "!**/_backups/**" -S \
  -e "from[[:space:]]+[\"'\'' ]\\./pages/" \
  -e "from[[:space:]]+[\"'\'' ]\\.\\./pages/" \
  app/src 2>/dev/null || true)"

# Exclude tests
HITS="$(echo "$HITS" | rg -v "__tests__/" || true)"

OFF="$(echo "$HITS" | awk -F: -v allow="$ALLOW_RE" 'NF>2{f=$1; if (f !~ allow) print $0;}' || true)"

if [[ -n "${OFF:-}" ]]; then
  echo "[gate][FAIL] direct pages/** imports still present in app/src (must route via surfaces/_legacy shims):"
  echo "$OFF"
  exit 1
fi

echo "[gate][OK] no direct pages/** imports in app/src (outside shims)."
