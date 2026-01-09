#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
REPORTS="$ROOT/_REPORTS"
INDEX="$REPORTS/INDEX.md"

mkdir -p "$REPORTS"

{
  echo "# _REPORTS — Index"
  echo ""
  echo "Ce fichier est la source of truth des audits exécutés (hors artefacts volumineux ignorés par Git)."
  echo ""
  echo "## Derniers rapports (triés par nom)"
  echo ""
  if [ -d "$REPORTS" ]; then
    ls -1 "$REPORTS" 2>/dev/null \
      | rg -v '^(INDEX\.md|\.gitkeep)$' \
      | sort \
      | tail -n 30 \
      | sed 's/^/- /'
  fi
  echo ""
} > "$INDEX"
