#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

need() { test -f "$ROOT/$1" || { echo "ERR_REGION_LAYER_MISSING: $1"; exit 1; }; }

need "core-kernel/src/region/regionPolicy.contract.ts"
need "core-kernel/src/region/regionPolicy.ts"

echo "[gate][OK] region policy layer present."
