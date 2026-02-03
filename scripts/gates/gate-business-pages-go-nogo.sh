#!/usr/bin/env bash
set -euo pipefail
cd "${1:-.}"
node ./scripts/gates/check-business-pages-go-nogo.mjs
