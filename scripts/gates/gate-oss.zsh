#!/usr/bin/env zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== GATE: git hygiene ==="
# Reject OS/IDE/build artifacts from being committed (repo policy)
BAD_TRACKED="$(git ls-files -z | tr '\0' '\n' | rg --pcre2 '(^|/)\.DS_Store$|^app/dist/|^dist/|^node_modules/|^\.vite/|^\.cache/' || true)"
if [[ -n "${BAD_TRACKED}" ]]; then
  echo "FAIL: tracked forbidden artifacts:"
  echo "${BAD_TRACKED}"
  exit 10
fi

BAD_STAGED="$(git diff --cached --name-status | rg -v '^D\t' | rg --pcre2 '(^|/)\.DS_Store$|^app/dist/|^dist/|^node_modules/|^\.vite/|^\.cache/' || true)"
if [[ -n "${BAD_STAGED}" ]]; then
  echo "FAIL: staged forbidden artifacts:"
  echo "${BAD_STAGED}"
  exit 11
fi

echo ""
echo "=== GATE: audit-no-leaks ==="
./scripts/audit/audit-no-leaks.zsh

echo ""
echo "=== GATE: app build ==="
( cd app && npm run build )

echo ""
echo "=== GATE: tests (non-interactive) ==="
( cd app && npm run test )

echo ""
echo "OK: gate-oss PASS"
