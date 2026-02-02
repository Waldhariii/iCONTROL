#!/usr/bin/env bash
set -euo pipefail

TRACKED=$(git ls-files | grep -E '^(_artifacts|_audit)/' || true)

if [ -n "$TRACKED" ]; then
  echo "ERR_GENERATED_TRACKED:"
  echo "$TRACKED"
  exit 1
fi

echo "OK: generated-only respected"
