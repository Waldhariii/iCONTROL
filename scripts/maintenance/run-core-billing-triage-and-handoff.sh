#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="${ROOT:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
cd "$ROOT"

echo "=== RUN core-billing triage pack ==="
bash scripts/maintenance/core-billing-triage-pack.sh

echo
echo "=== Locate newest report ==="
LATEST="$(ls -1t runtime/reports/DIAG_CORE_BILLING_*.log 2>/dev/null | head -1 || true)"
if [ -z "${LATEST:-}" ]; then
  echo "ERR: no DIAG_CORE_BILLING report found under runtime/reports/"
  exit 2
fi
echo "LATEST_REPORT=$LATEST"

echo
echo "=== Extract decision signals (tailored for Cursor) ==="
echo "----- [A] Any @modules usage (grep hits) -----"
grep -nE "Find ANY @modules usage|@modules/" "$LATEST" | head -120 || true

echo
echo "----- [B] BillingService/BILLING_CONF/core-billing references -----"
grep -nE "BillingService|BILLING_CONF|core-billing" "$LATEST" | head -180 || true

echo
echo "----- [C] Git history hint (log -S) -----"
grep -nE "log -S|introduced|@modules/core-billing" "$LATEST" | head -120 || true

echo
echo "=== Cursor handoff (copy/paste) ==="
cat <<'CURSOR'
OBJECTIF:
- Corriger l'erreur Vite: Failed to resolve import "@modules/core-billing" depuis apps/control-plane/src/main.ts (ligne ~11)
- Aucune régression, zéro doublon, compatible Level 11, gates green.

CONTRAINTES:
- Ne pas créer de modules fictifs.
- Ne pas "inventer" des alias Vite au hasard.
- Préférer la vérité du repo: module existant ailleurs / branche / historique git.
- Patch minimal, testable, rollback-friendly.

INPUTS:
- Ouvre le dernier rapport: runtime/reports/DIAG_CORE_BILLING_*.log (le plus récent)
- Applique la décision A/B/C:

A) Le module existe sur une autre branche/commit -> récupérer proprement (cherry-pick/merge ciblé).
B) Le module existe mais sous un autre chemin -> réécrire l'import vers le chemin réel + ajuster alias/tsconfig si nécessaire (sans casser d'autres @modules).
C) Le module n'existe pas et doit être optionnel -> remplacer import statique par dynamic import + guard (fallback propre) pour que Vite ne crash plus.

DELIVERABLE:
- Un seul PR/commit propre avec:
  - Fix import(s) dans apps/control-plane/src/main.ts
  - Ajustements nécessaires (vite.config.ts / tsconfig paths) uniquement si preuve dans le rapport
  - Commandes de vérification: pnpm dev, build, tests/gates pertinents.

ACTION:
- Lis le rapport, choisis A/B/C, implémente, puis colle ici:
  1) fichiers modifiés
  2) commande(s) de validation + résultats
CURSOR

echo
echo "DONE."
