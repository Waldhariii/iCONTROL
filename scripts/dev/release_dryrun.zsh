#!/usr/bin/env zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

TAG="${1:-v0.2.0-tools999}"
MODE="${2:---prerelease}"   # --prerelease | --ga
SCOPE="${3:-Terminal Gate}"

echo "OK: ReleaseOps terminal-only dry-run"
echo "OK: TAG=$TAG"
echo "OK: MODE=$MODE"
echo "OK: SCOPE=$SCOPE"

test -z "$(git status --porcelain=v1)" || { echo "BLOCKED: dirty tree"; git status --porcelain=v1; exit 1; }

# CI_STRICT=1 => read-only (no tag/retag/push), DRY_RUN => no gh ops
CI=1 CI_STRICT=1 ./scripts/release/publish.zsh TAG="$TAG" "$MODE" --dry-run --scope "$SCOPE"
test -z "$(git status --porcelain=v1)" || { echo "BLOCKED: dirty tree after dry-run"; git status --porcelain=v1; exit 1; }

echo "OK: dry-run terminal gate PASS"
