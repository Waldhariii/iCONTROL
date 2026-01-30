#!/usr/bin/env bash
set -euo pipefail

echo "[RELEASE-BUNDLE] build + gates + artifacts"

TS=$(date +%Y%m%d_%H%M%S)
export TS

npm run -s build:prod
npm run -s verify:prod:assets
npm run -s proofs:logs
cd app && npm run -s verify:ssot:fast && cd ..

node scripts/gates/dist-tree-hash.mjs > _audit/LAST_DIST_TREE_HASH.txt

if ! ls -1 dist_rollback_*.tgz >/dev/null 2>&1; then
  echo "[RELEASE-BUNDLE] rollback missing -> creating"
  tar -czf "dist_rollback_${TS}.tgz" dist
fi

LATEST_MANIFEST="$(ls -1t _audit/ASSETS_MANIFEST_*.json 2>/dev/null | head -n 1 || true)"
if [[ -z "${LATEST_MANIFEST:-}" ]]; then
  echo "ERR: no _audit/ASSETS_MANIFEST_*.json found; run npm run -s assets:manifest first"
  exit 1
fi
cp -f "$LATEST_MANIFEST" ASSETS_MANIFEST_LATEST.json

OUT="$(node scripts/gates/generate-release-notes.mjs)"
echo "[RELEASE-BUNDLE] release notes => $OUT"

echo "[RELEASE-BUNDLE] PASS"
