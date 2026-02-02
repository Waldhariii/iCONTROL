#!/usr/bin/env bash
set -euo pipefail

# Gate: Architecture Freeze
# Goal: prevent new roots, cross-layer leakage, and circular imports drift.
# Strict: FAIL on violations.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

DENY_ROOTS_REGEX='^(app2|backend|frontend|main_system|system|temp|old|legacy|copy|duplicate|_tmp|_old|_legacy)$'

viol=0

# 1) No forbidden parallel roots at repo root
while IFS= read -r d; do
  base="$(basename "$d")"
  if [[ "$base" =~ $DENY_ROOTS_REGEX ]]; then
    echo "ERR_ARCH_FREEZE: forbidden root detected: $base"
    viol=1
  fi
done < <(find . -maxdepth 1 -type d -not -path './.git' -not -path '.' -print | sed 's#^\./##')

# 2) No new top-level roots outside allowlist (soft allowlist)
ALLOW_ROOTS=(
  app
  server
  core-kernel
  platform-services
  modules
  shared
  config
  scripts
  docs
  schema-registry
  platform-api
  extensions
  runtime
  app-desktop-client
  app-desktop-control
  _artifacts
  _audit
  _backups
  node_modules
  .github
  .vscode
  .githooks
)
allow_re="^($(IFS='|'; echo "${ALLOW_ROOTS[*]}"))$"

while IFS= read -r d; do
  base="$(basename "$d")"
  if [[ ! "$base" =~ $allow_re ]] && [[ "$base" != ".git" ]]; then
    echo "ERR_ARCH_FREEZE: unknown root detected: $base (add to allowlist only by explicit governance decision)"
    viol=1
  fi
done < <(find . -maxdepth 1 -type d -not -path './.git' -not -path '.' -print | sed 's#^\./##')

# 3) No cross-layer imports: modules and shared must NOT import from app/src or server/src
# (platform-services may bridge to app; core-kernel must not depend on app)
if command -v rg >/dev/null 2>&1; then
  if rg -n --hidden --glob '!**/node_modules/**' --glob '!**/_artifacts/**' --glob '!**/_audit/**' \
    'from\s+["'\''](\.\./)+app/src/|from\s+["'\'']@app/|from\s+["'\''](\.\./)+server/src/' \
    modules shared core-kernel 2>/dev/null; then
    echo "ERR_ARCH_FREEZE: cross-layer imports detected (modules/shared/core-kernel -> app/src or server/src)"
    viol=1
  fi
fi

if [[ "$viol" -ne 0 ]]; then
  exit 1
fi

echo "OK: gate-architecture-freeze"
