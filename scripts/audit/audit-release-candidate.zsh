#!/usr/bin/env zsh
set -euo pipefail

echo "=== AUDIT: RC (release candidate) ==="

# 0) Repo must be clean (no accidental drift)
if [ -n "$(git status --porcelain=v1)" ]; then
  echo "BLOCKED: working tree not clean:"
  git status --porcelain=v1
  exit 1
fi
echo "OK: working tree clean"

# 1) Gates
./scripts/audit/audit-no-leaks.zsh
./scripts/audit/audit-ui-contrast.zsh
./scripts/audit/audit-ui-no-hardcoded-colors.zsh
[ -f ./scripts/audit/audit-ui-theme-cssvars.zsh ] && ./scripts/audit/audit-ui-theme-cssvars.zsh
[ -f ./scripts/audit/audit-ui-cssvars-rollout.zsh ] && ./scripts/audit/audit-ui-cssvars-rollout.zsh
[ -f ./scripts/audit/audit-ui-cssvars-backlog-shared.zsh ] && ./scripts/audit/audit-ui-cssvars-backlog-shared.zsh || true

# 2) Build + tests
npm run build:app
npm test

echo "OK: RC PASS"
