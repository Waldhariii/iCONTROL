#!/usr/bin/env bash
set -euo pipefail
echo "[PRE-RELEASE] build + prod gates"

npm run -s build:prod
npm run -s verify:prod:assets
npm run -s proofs:logs
cd app && npm run -s verify:ssot:fast && cd ..

node scripts/gates/dist-tree-hash.mjs > _audit/LAST_DIST_TREE_HASH.txt

echo "[PRE-RELEASE] PASS"
