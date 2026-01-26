#!/usr/bin/env zsh
set -euo pipefail

resolve_tracked() {
  # Deterministic tracked-file resolver (never use `rg` because it prefixes line numbers)
  git ls-files 2>/dev/null || rg --files
}


SCOPE="modules/core-system/ui/frontend-ts/pages/_shared"

echo "=== AUDIT: P17.3 UI css vars backlog (_shared only, non-blocking) ==="
echo "Scope: ${SCOPE}/**/*.ts"

MATCHES=$(rg "\\$\\{TOK\\.(text|mutedText|border|card|panel|accent|accent2)\\}" "$SCOPE" -S || true)

if [ -n "$MATCHES" ]; then
  echo "WARN: TOK.* détecté dans _shared/** (backlog de migration CSS vars)."
  echo "$MATCHES"
  exit 0
fi

echo "OK: aucun TOK.* dans _shared/**"
