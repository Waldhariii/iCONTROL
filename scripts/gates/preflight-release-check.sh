#!/usr/bin/env bash
set -euo pipefail
AUD="_audit"

echo "[PREFLIGHT] checking required release artifacts..."

test -f ASSETS_MANIFEST_LATEST.json || { echo "ERR: missing ASSETS_MANIFEST_LATEST.json"; exit 1; }
test -f "$AUD/LAST_DIST_TREE_HASH.txt" || { echo "ERR: missing $AUD/LAST_DIST_TREE_HASH.txt"; exit 1; }

ROLLBACK="$(ls -1t dist_rollback_*.tgz 2>/dev/null | head -n 1 || true)"
test -n "${ROLLBACK:-}" || { echo "ERR: missing dist_rollback_*.tgz"; exit 1; }

# Confirm stable manifest is a real JSON file and has non-trivial size
python3 - <<'PY'
import json, os, sys
p="ASSETS_MANIFEST_LATEST.json"
if os.path.getsize(p) < 10:
  print("ERR: manifest too small")
  sys.exit(1)
with open(p,"r",encoding="utf-8") as f:
  json.load(f)
print("OK: manifest parses")
PY

echo "[PREFLIGHT] PASS"
