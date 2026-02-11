#!/usr/bin/env bash
set -euo pipefail

# Only these pages are allowed in the baseline.
# APP pages under apps/control-plane/src/surfaces/app/*/Page.tsx
# CP  pages under apps/control-plane/src/surfaces/cp/*/Page.tsx
ALLOW_APP_RE='^apps/control-plane/src/surfaces/app/(dashboard|login|clients|jobs|gallery|account|settings|home-app|client-access-denied|client-catalog|client-disabled|client-pages-inventory|registry)/Page\.tsx$'
ALLOW_CP_RE='^apps/control-plane/src/surfaces/cp/(dashboard|login|account|settings|home-cp|login-theme|notfound|pages|registry|users|gallery)/Page\.tsx$'

# List candidate page entrypoints
files="$(git ls-files 'apps/control-plane/src/surfaces/app/*/Page.tsx' 'apps/control-plane/src/surfaces/cp/*/Page.tsx' 2>/dev/null || true)"

bad=0
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if [[ "$f" == apps/control-plane/src/surfaces/app/* ]]; then
    if ! [[ "$f" =~ $ALLOW_APP_RE ]]; then
      echo "[gate][FAIL] extra APP page: $f"
      bad=1
    fi
  elif [[ "$f" == apps/control-plane/src/surfaces/cp/* ]]; then
    if ! [[ "$f" =~ $ALLOW_CP_RE ]]; then
      echo "[gate][FAIL] extra CP page: $f"
      bad=1
    fi
  fi
done <<< "$files"

if [[ "$bad" == "1" ]]; then
  exit 1
fi

echo "[gate][OK] pages whitelist satisfied."
