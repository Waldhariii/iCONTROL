#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO" || exit 1

ts="$(date +%Y%m%d_%H%M%S)"
LOG="_audit/RELEASE_RC_${ts}.log"
mkdir -p _audit

echo "=== RELEASE RC (prod candidate) ===" | tee "$LOG"
git status -sb | tee -a "$LOG"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERR_RELEASE_RC_DIRTY_TREE: working tree not clean" | tee -a "$LOG"
  exit 2
fi

# Governance gates first
npm run -s gate:release-rc-artifacts | tee -a "$LOG"

# Must be green
npm run -s gate:preflight:prod | tee -a "$LOG"

# Optional: generate release bundle/index if your repo already supports it
if npm run -s release:manifest >/dev/null 2>&1; then
  npm run -s release:manifest | tee -a "$LOG"
fi
if npm run -s release:bundle >/dev/null 2>&1; then
  npm run -s release:bundle | tee -a "$LOG"
fi

# Tag (local only); pushing is a separate explicit action
TAG="rc-${ts}"
git tag -a "$TAG" -m "release candidate ${ts}" | tee -a "$LOG"
echo "TAG_CREATED=$TAG" | tee -a "$LOG"

echo "OK: RELEASE RC" | tee -a "$LOG"
echo "LOG=$LOG" | tee -a "$LOG"
