#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"

echo "[gate] canonical-structure"

for forbidden in \
  app2 \
  main_system \
  system \
  backend \
  frontend \
  temp \
  old \
  legacy \
  copy \
  duplicate
do
  if find "$ROOT" -maxdepth 1 -type d -name "*$forbidden*" | grep -q .
  then
    echo "ERR_PARALLEL_ROOT: forbidden directory detected"
    exit 1
  fi
done

if git ls-files | grep -E '^(_artifacts|_audit)/'
then
  echo "ERR_GENERATED_TRACKED: generated folders must never be tracked"
  exit 1
fi

if grep -R "from '../../app" modules 2>/dev/null
then
  echo "ERR_IMPORT_BOUNDARY: modules must not import from app"
  exit 1
fi

if grep -R "from '../../server" modules 2>/dev/null
then
  echo "ERR_IMPORT_BOUNDARY: modules must not import from server"
  exit 1
fi

echo "[gate] canonical-structure PASS"
