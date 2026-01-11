#!/usr/bin/env zsh
set -euo pipefail

# ICONTROL_AUDIT_UI_CONTRAST_V1
# Rule: block inline opacity for text rows in UI pages.
# Allowlist is explicit and should be reduced over time.

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

TARGET="modules/core-system/ui/frontend-ts/pages"
PATTERN='opacity:\s*\.[0-9]|opacity\s*=\s*\"?\.[0-9]'

# Allowlist (path substrings). Keep minimal and reduce over time.
ALLOWLIST=(
  "$TARGET/_shared/sections.ts"
  "$TARGET/_shared/uiBlocks.ts"
  "$TARGET/_shared/mainSystem.shared.ts"
  "$TARGET/login.ts"
  "$TARGET/developer/index.ts"
  "$TARGET/toolbox/sections/diagnostics.ts"
  "$TARGET/settings/branding.ts"
  "$TARGET/settings/index.ts"
)

matches=()
while IFS= read -r line; do
  [ -z "$line" ] && continue
  file="${line%%:*}"
  allowed=0
  for a in "${ALLOWLIST[@]}"; do
    if [[ "$file" == *"$a"* ]]; then
      allowed=1
      break
    fi
  done
  if [[ "$allowed" -eq 0 ]]; then
    matches+=("$line")
  fi
done < <(rg -n --glob "$TARGET/**" "$PATTERN" -S || true)

if [[ "${#matches[@]}" -gt 0 ]]; then
  echo "FAIL: inline opacity detected in UI files (not allowlisted):"
  printf '%s\n' "${matches[@]}"
  exit 2
fi

echo "OK: UI contrast audit PASS"
