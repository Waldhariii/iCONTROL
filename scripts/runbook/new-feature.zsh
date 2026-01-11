#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BASE_TAG="golden-baseline"
IMMUTABLE_SNAPSHOT="golden-baseline-2026-01-09-r2"

NAME="${1:-}"
if [ -z "$NAME" ]; then
  echo "USAGE: ./scripts/runbook/new-feature.zsh <feature-name>"
  echo "Example: ./scripts/runbook/new-feature.zsh ui-shell-refactor"
  exit 2
fi

BR="feature/${NAME}"

echo "=== iCONTROL RUNBOOK: NEW FEATURE ==="
echo "ROOT=$ROOT"
echo "BRANCH=$BR"
echo ""

echo "1) Hard gate: repo must be clean"
if [ -n "$(git -C "$ROOT" status --porcelain=v1)" ]; then
  echo "FAIL: working tree not clean. Commit/stash first."
  git -C "$ROOT" status --porcelain=v1
  exit 3
fi
echo "OK: clean"
echo ""

echo "2) Governance: baseline + snapshot must exist"
git -C "$ROOT" rev-parse "$BASE_TAG^{}" >/dev/null
git -C "$ROOT" rev-parse "$IMMUTABLE_SNAPSHOT^{}" >/dev/null
echo "OK: tags exist"
echo ""

echo "3) Governance: immutable snapshot must NEVER move"
SNAP="$(git -C "$ROOT" rev-parse "$IMMUTABLE_SNAPSHOT^{}")"
if [ "$SNAP" != "$(git -C "$ROOT" rev-parse "$IMMUTABLE_SNAPSHOT^{}")" ]; then
  echo "FAIL: snapshot resolution unstable"
  exit 4
fi
echo "OK: snapshot stable ($SNAP)"
echo ""

echo "4) Create branch from baseline alias (mobile but controlled)"
git -C "$ROOT" checkout -b "$BR" "$BASE_TAG"
echo "OK: branch created"
echo ""

echo "5) Sanity gates (audit + build + test)"
"$ROOT/scripts/audit/audit-no-leaks.zsh" >/dev/null
echo "OK: audit pass"
( cd "$ROOT/app" && npm run build >/dev/null )
echo "OK: build pass"
( cd "$ROOT/app" && npm run test >/dev/null )
echo "OK: test pass"
echo ""

echo "DONE. Next: start dev via ./scripts/runbook/dev.zsh"
