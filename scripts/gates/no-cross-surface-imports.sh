#!/usr/bin/env bash
set -euo pipefail

BASE="app/src/surfaces"

if [[ ! -d "$BASE" ]]; then
  echo "[gate][SKIP] $BASE not found"
  exit 0
fi

HITS="$(rg -n --hidden --glob "!**/node_modules/**" -S \
  -e "from\\s+[\"'].*\\/surfaces\\/app\\/" \
  -e "from\\s+[\"'].*\\/surfaces\\/cp\\/" \
  "$BASE" || true)"

OFF="$(echo "$HITS" | awk -F: '
  NF>2 {
    file=$1; line=$0;
    if (file ~ /\/surfaces\/app\// && line ~ /\/surfaces\/cp\//) print line;
    if (file ~ /\/surfaces\/cp\// && line ~ /\/surfaces\/app\//) print line;
  }
' || true)"

if [[ -n "${OFF:-}" ]]; then
  echo "[gate][FAIL] cross-surface imports detected (surface->surface forbidden):"
  echo "$OFF"
  exit 1
fi

echo "[gate][OK] no cross-surface imports"
