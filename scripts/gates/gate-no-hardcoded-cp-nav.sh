#!/usr/bin/env bash
set -euo pipefail
ALLOWLIST="${CP_NAV_ALLOWLIST:-}"
node "./scripts/gates/check-no-hardcoded-cp-nav.mjs"
