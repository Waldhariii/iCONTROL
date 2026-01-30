#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# Cherche "python" (sans le 3) dans les fichiers versionnés,
# en excluant le wrapper repo et quelques dossiers.
violations="$(git grep -nE '(^|[[:space:]])python([[:space:]]|$|-)+' -- \
  ':!scripts/tools/python' \
  ':!**/node_modules/**' \
  ':!**/.git/**' \
  ':!**/dist/**' \
  ':!**/build/**' \
  ':!**/.next/**' \
  ':!**/.turbo/**' \
  ':!**/coverage/**' \
  || true)"

if [[ -n "${violations}" ]]; then
  echo "[ERR] Usage de 'python' détecté. Invariant: utiliser 'python3' ou 'scripts/tools/python'."
  echo
  echo "${violations}"
  exit 1
fi

echo "[OK] Gate python3-only: aucun 'python' non conforme détecté."
