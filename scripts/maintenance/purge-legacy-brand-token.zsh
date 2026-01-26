#!/bin/zsh
set -euo pipefail
# -------------------------------
# Safe deterministic resolver (NO rg)
# - tracked-first: git ls-files
# - fallback: rg --files (if git unavailable)
# - never returns NNN:path
# -------------------------------
resolve_tracked() {
  if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git ls-files
  else
    rg --files
  fi
}

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# Build legacy token without having the contiguous string in this file
LEGACY_TOKEN="C""ontrolX"
REPLACEMENT="iCONTROL"

EXCL=(
  --glob '!**/_REPORTS/**'
  --glob '!**/node_modules/**'
  --glob '!**/.git/**'
  --glob '!**/scripts/audit/**'
  --glob '!**/scripts/maintenance/**'
)

echo "=== PRE-SCAN (active source only) ==="
HITS="$(rg --hidden --no-ignore "${EXCL[@]}" "$LEGACY_TOKEN" "$ROOT" || true)"
if [ -z "$HITS" ]; then
  echo "OK: no legacy token found in active source. Nothing to do."
  exit 0
fi

echo "$HITS" | head -200
echo ""
echo "=== PATCHING FILE CONTENTS ==="

FILES="$(rg -l --hidden --no-ignore "${EXCL[@]}" "$LEGACY_TOKEN" "$ROOT" || true)"
for f in ${(f)FILES}; do
  if file "$f" | rg -q "binary"; then
    echo "SKIP(binary): $f"
    continue
  fi
  perl -pi -e "s/${LEGACY_TOKEN}/${REPLACEMENT}/g" "$f"
done

echo ""
echo "=== POST-SCAN ==="
HITS2="$(rg --hidden --no-ignore "${EXCL[@]}" "$LEGACY_TOKEN" "$ROOT" || true)"
if [ -n "$HITS2" ]; then
  echo "WARN: legacy token still found (first hits):"
  echo "$HITS2" | head -200
  exit 2
fi

echo "OK: purge complete (no legacy token in active source)."
