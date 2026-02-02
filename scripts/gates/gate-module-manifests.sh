#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STRICT="${MODULE_MANIFEST_STRICT:-0}"
missing=0

while IFS= read -r d; do
  mod="$(basename "$d")"
  [[ "$mod" =~ ^(_|\.) ]] || [[ "$mod" == "node_modules" ]] && continue
  if [[ ! -f "modules/_manifests/${mod}.manifest.json" ]]; then
    echo "WARN_MODULE_MANIFEST_MISSING: ${mod} (expected modules/_manifests/${mod}.manifest.json)"
    missing=$((missing+1))
  fi
done < <(find modules -maxdepth 1 -type d -not -path 'modules' -print 2>/dev/null || true)

if [[ "$missing" -gt 0 && "$STRICT" -eq 1 ]]; then
  echo "ERR_MODULE_MANIFEST: missing=${missing} (set MODULE_MANIFEST_STRICT=0 to warn-only)"
  exit 1
fi

echo "OK: gate-module-manifests missing=${missing} strict=${STRICT}"
