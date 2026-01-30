#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.." || exit 1

echo "[rc-freeze] verify RC export pack + checksum..."

# Find latest RC export
dir="dist/exports"
[ -d "$dir" ] || { echo "[rc-freeze][SKIP] no dist/exports"; exit 0; }

latest="$(ls -1t "$dir"/ICONTROL_CP_EXPORT_*_INDEX.md 2>/dev/null | head -n 1 || true)"
[ -n "$latest" ] || { echo "[rc-freeze][SKIP] no RC index"; exit 0; }

base="${latest%_INDEX.md}"
tgz="${base}.tgz"
sha="${base}.tgz.sha256"

[ -f "$tgz" ] || { echo "[rc-freeze][FAIL] missing export: $tgz"; exit 1; }
[ -f "$sha" ] || { echo "[rc-freeze][FAIL] missing export sha: $sha"; exit 1; }

want="$(cat "$sha")"
got="$(shasum -a 256 "$tgz" | awk '{print $1}')"

if [ "$want" != "$got" ]; then
  echo "[rc-freeze][FAIL] checksum mismatch"
  echo "  want: $want"
  echo "  got : $got"
  exit 1
fi

echo "[rc-freeze][OK] export checksum stable: $got"
