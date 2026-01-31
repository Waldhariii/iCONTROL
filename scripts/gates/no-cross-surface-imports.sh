#!/usr/bin/env bash
set -euo pipefail

# Règle: aucune importation directe d'une surface vers une autre.
# Autorisé: app/src/platform/** peut importer surfaces (runtime).
# Interdit: app/src/surfaces/app/** -> app/src/surfaces/cp/** et inversement.

ROOT="app/src/surfaces"
RG_OPTS=(--hidden --glob '!**/node_modules/**' --glob '!**/dist/**' -n -S)

# Scope: surfaces only. We do not scan legacy pages or other dirs.
hits="$(rg "${RG_OPTS[@]}" -g'*.ts' -g'*.tsx' -e 'from\s+["'\''](\.\./)+surfaces\/' "$ROOT" 2>/dev/null || true)"

# Any hit inside surfaces is a violation (no cross-surface imports allowed).
off="$hits"

if [[ -n "${off:-}" ]]; then
  echo "[gate][FAIL] cross-surface import detected inside surfaces:"
  echo "$off"
  exit 1
fi

echo "[gate][OK] no forbidden cross-surface imports (platform-only allowed)."
