#!/usr/bin/env bash
set -euo pipefail

# Only these pages are allowed in the baseline.
# APP pages under app/src/pages/app
# CP  pages under app/src/pages/cp
ALLOW_APP_RE='^app/src/pages/app/(dashboard|login|account|settings)\.tsx$'
ALLOW_CP_RE='^app/src/pages/cp/(dashboard|login|account|settings)\.tsx$'

# List candidate page entrypoints (adjust if your structure differs)
files="$(git ls-files 'app/src/pages/app/*.tsx' 'app/src/pages/cp/*.tsx' 2>/dev/null || true)"

bad=0
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if [[ "$f" == app/src/pages/app/* ]]; then
    if ! [[ "$f" =~ $ALLOW_APP_RE ]]; then
      echo "[gate][FAIL] extra APP page: $f"
      bad=1
    fi
  elif [[ "$f" == app/src/pages/cp/* ]]; then
    if ! [[ "$f" =~ $ALLOW_CP_RE ]]; then
      echo "[gate][FAIL] extra CP page: $f"
      bad=1
    fi
  fi
done <<< "$files"

if [[ "$bad" == "1" ]]; then
  exit 1
fi

echo "[gate][OK] pages whitelist satisfied (APP+CP baseline only)."
