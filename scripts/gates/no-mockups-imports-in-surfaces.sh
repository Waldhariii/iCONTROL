#!/usr/bin/env bash
set -euo pipefail

# Surfaces must not import mockups (mockups are for sandbox only).
# Allowed path: app/src/ui-v2/mockups/** can import anything internally,
# but app/src/surfaces/** must never import from ui-v2/mockups.
HITS="$(rg -n --hidden --glob '!**/node_modules/**' -S \
  -e "from\\s+['\"]/.*ui-v2/mockups" \
  -e "from\\s+['\"]@/ui-v2/mockups" \
  app/src/surfaces 2>/dev/null || true)"

if [[ -n "${HITS:-}" ]]; then
  echo "[gate][FAIL] surfaces import mockups (forbidden):"
  echo "$HITS"
  exit 1
fi

echo "[gate][OK] no mockups imports in surfaces."
