#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ ! -d "schema-registry" ]]; then
  echo "ERR_SCHEMA_DRIFT: missing schema-registry/"
  exit 1
fi

if git diff --name-status --cached 2>/dev/null | grep -E '^D\s+schema-registry/' >/dev/null 2>&1; then
  echo "ERR_SCHEMA_DRIFT: deletion detected in schema-registry (append-only policy)"
  exit 1
fi

echo "OK: gate-schema-drift"
