#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

# Guardrails
if [[ "$(git status --porcelain)" != "" ]]; then
  echo "ERR_BASELINE_DIRTY_WORKTREE: working tree not clean. Commit or stash first."
  exit 1
fi

BRANCH="$(git branch --show-current)"
if [[ "$BRANCH" == "" ]]; then
  echo "ERR_BASELINE_NO_BRANCH: detached HEAD not allowed for baseline."
  exit 1
fi

echo "=== PROD PREFLIGHT (must PASS) ==="
npm run -s gate:preflight:prod

echo "=== Create & push baseline tag ==="
ts="$(date +%Y%m%d_%H%M%S)"
tag="baseline-${ts}"

git tag -a "$tag" -m "prod baseline — preflight PASS — ${ts}"
git push origin "$tag"

echo "OK_BASELINE_TAG_PUSHED: $tag"
