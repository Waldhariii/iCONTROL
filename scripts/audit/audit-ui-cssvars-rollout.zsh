#!/usr/bin/env zsh
set -euo pipefail

echo "=== AUDIT: P17 UI css vars rollout (pages only) ==="
SCOPE="modules/core-system/ui/frontend-ts/pages"
echo "Scope: ${SCOPE}/**/*.ts (exclut _shared/**)"

# On vise les usages de TOK.* dans les template strings/styles (signal de non-migration CSS vars).
# NOTE: _shared/** est exclu volontairement (backlog P17.2).
MATCHES=$(rg -n "\\$\\{TOK\\.(text|mutedText|border|card|panel|accent|accent2)\\}" "$SCOPE" -S | rg -v "/_shared/" || true)

if [ -n "$MATCHES" ]; then
  echo "BLOCKED: TOK.* détecté dans pages/** (doit passer par CSS vars var(--ic-*) avec fallback tokens)."
  echo "$MATCHES"
  exit 1
fi

# Hard stop: pattern qui casse esbuild (déjà vu)
if rg -n "\\$\\{\\s*var\\(" "$SCOPE" -S >/dev/null; then
  echo "BLOCKED: \${var( ... )} détecté (esbuild: Unexpected var)."
  rg -n "\\$\\{\\s*var\\(" "$SCOPE" -S || true
  exit 1
fi

echo "OK: UI css vars rollout audit PASS"
