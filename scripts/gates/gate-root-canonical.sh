#!/usr/bin/env bash
set -euo pipefail

FORBIDDEN=(
  app2
  backend
  frontend
  legacy
  old
  temp
  copy
  duplicate
  system
  main_system
)

for dir in "${FORBIDDEN[@]}"; do
  if [ -d "$dir" ]; then
    echo "ERR_CANONICAL_ROOT: forbidden root detected -> $dir"
    exit 1
  fi
done

echo "OK: canonical roots enforced"
