#!/usr/bin/env bash
set -euo pipefail

# Règle: aucune importation directe d'une surface vers une autre.
# Autorisé: app/src/platform/** peut importer surfaces (runtime).
# Interdit: app/src/surfaces/app/** -> app/src/surfaces/cp/** et inversement.

ROOT="app/src/surfaces"
ALLOW_FROM_PLATFORM='^app/src/platform/'
RG_OPTS=(--hidden --glob '!**/node_modules/**' --glob '!**/dist/**' -n -S)

hits="$(rg "${RG_OPTS[@]}" -g'*.ts' -g'*.tsx' -e 'from\s+["'\''](\.\./)+surfaces\/' app/src 2>/dev/null || true)"

# On filtre les fichiers sous platform (autorisés)
off="$(echo "$hits" | awk -F: -v allow="$ALLOW_FROM_PLATFORM" 'NF>1{file=$1; if (file !~ allow) print $0;}' || true)"

if [[ -n "${off:-}" ]]; then
  echo "[gate][FAIL] cross-surface import detected outside platform:"
  echo "$off"
  exit 1
fi

echo "[gate][OK] no forbidden cross-surface imports (platform-only allowed)."
