#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/danygaudreault/iCONTROL"
cd "$ROOT" || exit 1

ts_utc(){ date -u +%Y%m%d_%H%M%S; }
ensure_dir(){ mkdir -p "$1"; }

echo "=== release-train-vnext ==="
git status -sb
if [ -n "$(git status --porcelain)" ]; then
  echo "ERR: working tree not clean."
  exit 1
fi

# Must run on main and be up-to-date
BR="$(git branch --show-current)"
if [ "$BR" != "main" ]; then git checkout main; fi
git pull --ff-only origin main

HEAD_NOW="$(git rev-parse HEAD)"
echo "HEAD_NOW=$HEAD_NOW"

# Canonical tags (existing train)
RC_TAG="$(git tag --list 'rc-*' --sort=-creatordate | head -n 1 || true)"
PROD_TAG="$(git tag --list 'prod-candidate-*' --sort=-creatordate | head -n 1 || true)"
BASE_TAG="$(git tag --list 'baseline-*' --sort=-creatordate | head -n 1 || true)"
echo "RC_TAG=$RC_TAG"
echo "PROD_TAG=$PROD_TAG"
echo "BASE_TAG=$BASE_TAG"
if [ -z "$RC_TAG" ] || [ -z "$PROD_TAG" ] || [ -z "$BASE_TAG" ]; then
  echo "ERR: missing canonical tags."
  exit 1
fi

# Run hard validation first
npm run -s verify:prod:fast
npm test

# Align tags + snapshot atomically to HEAD
bash ./scripts/release/tag-set-atomic.sh

# Must pass after atomic alignment
npm run -s gate:tag-integrity
npm run -s gate:preflight:prod

# Generate packs (generated-only) — do NOT git add any evidence outside allowlist
ts="$(ts_utc)"
PACK_ROOT="_artifacts/release/train/${ts}"
ensure_dir "$PACK_ROOT"
cat > "${PACK_ROOT}/TRAIN_MANIFEST.md" <<EOF
# RELEASE TRAIN (vNext)
ts: ${ts}
head: ${HEAD_NOW}
rc: ${RC_TAG}
prod: ${PROD_TAG}
baseline: ${BASE_TAG}

Checks:
- verify:prod:fast ✅
- npm test ✅
- gate:tag-integrity ✅
- gate:preflight:prod ✅
EOF

echo "OK: release-train-vnext complete. PACK_ROOT=${PACK_ROOT}"
