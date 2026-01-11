#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "=== iCONTROL DOCTOR ==="
echo "ROOT=$ROOT"
echo ""

echo "1) Repo status"
git -C "$ROOT" status --porcelain=v1
echo ""

echo "2) HooksPath governance"
HP="$(git -C "$ROOT" config --get core.hooksPath || true)"
echo "core.hooksPath=${HP:-<unset>}"
if [ "${HP:-}" != ".githooks" ]; then
  echo "WARN: hooksPath not set to .githooks (run: git config core.hooksPath .githooks)"
else
  echo "OK: hooksPath configured"
fi
echo ""

echo "3) Audit hard-gate"
"$ROOT/scripts/audit/audit-no-leaks.zsh" >/dev/null
echo "OK: audit pass"
echo ""

echo "4) Build smoke (Vite)"
( cd "$ROOT/app" && npm run build >/dev/null )
echo "OK: build pass"
echo ""

echo "5) Test gate (Vitest)"
( cd "$ROOT/app" && npm run test >/dev/null )
echo "OK: test pass"
echo ""

echo "6) Baseline pointers"
echo "golden-baseline -> $(git -C "$ROOT" rev-parse golden-baseline^{})"
echo "snapshot r2    -> $(git -C "$ROOT" rev-parse golden-baseline-2026-01-09-r2^{})"
echo "HEAD           -> $(git -C "$ROOT" rev-parse HEAD)"
echo ""
echo "DONE."
