#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
node ./scripts/gates/check-ssot-surface-route-map.mjs
