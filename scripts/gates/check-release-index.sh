#!/usr/bin/env bash
set -euo pipefail
IDX="docs/release/RELEASE_INDEX.md"
test -f "$IDX" || { echo "ERR: missing $IDX"; exit 1; }

# Must contain all key lines (coarse but stable)
grep -qF "Release bundle:" "$IDX" || { echo "ERR: index missing release bundle"; exit 1; }
grep -qF "Assets manifest (latest):" "$IDX" || { echo "ERR: index missing manifest"; exit 1; }
grep -qF "Dist tree hash:" "$IDX" || { echo "ERR: index missing dist hash"; exit 1; }
grep -qF "Rollback archive:" "$IDX" || { echo "ERR: index missing rollback"; exit 1; }

echo "[gate:release:index] PASS"
