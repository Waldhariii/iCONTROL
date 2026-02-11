#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
echo "RUN GATES FROM ROOT: $ROOT"
npm run -s test
npm run -s proofs:logs
cd app && npm run -s verify:ssot:fast && cd ..
npm run -s verify:prod:fast
