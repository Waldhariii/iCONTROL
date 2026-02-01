#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.." || exit 1

echo "[guard] scan CP inline styles…"
if rg -n --hidden --no-ignore -S '(style\.cssText\s*=|setAttribute\(\s*["'\'']style["'\'']|style\s*=\s*["'\''])' src/surfaces/cp \
  -g'*.ts' \
  -g'!**/*.bak*' -g'!**/*.deleted*' -g'!**/*.disabled*' -g'!src/_backups/**' ; then
  echo "[guard][FAIL] inline styles détectés sous src/surfaces/cp. Convertir vers classes SSOT + tokens."
  exit 1
fi
echo "[guard][OK] CP inline styles: none."
