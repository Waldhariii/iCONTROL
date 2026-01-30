#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.." || exit 1

OUT_DIR="dist/cp"
TMP_DIR="$OUT_DIR/_verify/extract_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TMP_DIR"

TARBALL="$(ls -1t "$OUT_DIR"/CP_BUNDLE_*.tgz 2>/dev/null | head -n 1 || true)"
if [ -z "${TARBALL:-}" ]; then
  echo "[cp:bundle:extract][FAIL] no CP_BUNDLE_*.tgz found"
  exit 1
fi

echo "[cp:bundle:extract] extracting $(basename "$TARBALL") -> $TMP_DIR"
tar -xzf "$TARBALL" -C "$TMP_DIR"

# Expected minimal layout
need=(
  "bundle/cp_src.tar.gz"
  "docs/CP_COMPLIANCE_REPORT.md"
  "package.json"
)

for p in "${need[@]}"; do
  if [ ! -f "$TMP_DIR/$p" ]; then
    echo "[cp:bundle:extract][FAIL] missing after extract: $p"
    exit 1
  fi
done

echo "[cp:bundle:extract][OK] structure looks good"
echo "[cp:bundle:extract][OK] extracted at: $TMP_DIR"
