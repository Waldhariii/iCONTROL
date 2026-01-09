#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

EXCL=(
  --glob '!**/_REPORTS/**'
  --glob '!**/node_modules/**'
  --glob '!**/.git/**'
)

echo "=== PRE-SCAN (active source only) ==="
HITS="$(rg -n --hidden --no-ignore "${EXCL[@]}" "iCONTROL" "$ROOT" || true)"
if [ -z "$HITS" ]; then
  echo "OK: no iCONTROL token found (active source). Nothing to do."
  exit 0
fi

echo "$HITS" | head -200
echo ""
echo "=== PATCHING FILE CONTENTS ==="

# Only patch text-like files (avoid binaries)
FILES="$(rg -l --hidden --no-ignore "${EXCL[@]}" "iCONTROL" "$ROOT" || true)"

# Replace iCONTROL -> iCONTROL in contents
# (You can adjust target token here if needed)
for f in ${(f)FILES}; do
  # Skip if file is huge binary-ish
  if file "$f" | rg -q "binary"; then
    echo "SKIP(binary): $f"
    continue
  fi
  perl -pi -e 's/iCONTROL/iCONTROL/g' "$f"
done

echo ""
echo "=== POST-SCAN ==="
HITS2="$(rg -n --hidden --no-ignore "${EXCL[@]}" "iCONTROL" "$ROOT" || true)"
if [ -n "$HITS2" ]; then
  echo "WARN: iCONTROL still found (showing first hits):"
  echo "$HITS2" | head -200
  exit 2
fi

echo "OK: purge complete (no iCONTROL token in active source)."
