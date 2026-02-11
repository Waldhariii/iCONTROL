#!/usr/bin/env bash
set -euo pipefail

if [[ -d "apps/control-plane/src/pages" ]]; then
  echo "[gate][FAIL] apps/control-plane/src/pages must never exist (surfaces-only architecture)."
  exit 1
fi

echo "[gate][OK] no legacy pages directory."
