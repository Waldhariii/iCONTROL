#!/usr/bin/env bash
set -euo pipefail

if [[ -d "app/src/pages" ]]; then
  echo "[gate][FAIL] app/src/pages must never exist (surfaces-only architecture)."
  exit 1
fi

echo "[gate][OK] no legacy pages directory."
