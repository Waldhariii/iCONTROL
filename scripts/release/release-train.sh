#!/usr/bin/env bash
set -euo pipefail

echo "=== RELEASE TRAIN START ==="

git status -sb

if [ -n "$(git status --porcelain)" ]; then
  echo "ERR: dirty tree"
  exit 1
fi

echo "--- Running gates ---"
npm run verify:prod:fast
npm test
npm run gate:tag-integrity
npm run gate:preflight:prod

echo "--- Align tags ---"
bash scripts/release/tag-set-atomic.sh

echo "--- Generate release pack ---"
TS=$(date +%Y%m%d_%H%M%S)
mkdir -p _artifacts/release/train/$TS

echo "HEAD=$(git rev-parse HEAD)" > _artifacts/release/train/$TS/HEAD.txt

echo "=== RELEASE TRAIN COMPLETE ==="
