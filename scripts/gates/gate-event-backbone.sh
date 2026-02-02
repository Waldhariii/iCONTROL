#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT" || exit 1

need() { [[ -f "$1" ]] || { echo "ERR_EVENT_BACKBONE_MISSING: $1"; exit 1; }; }

need "core-kernel/src/events/index.ts"
need "core-kernel/src/events/types.ts"
need "core-kernel/src/events/eventBus.ts"
need "core-kernel/src/events/outbox.ts"
need "core-kernel/src/events/memoryStore.ts"
need "core-kernel/src/_tests_/eventBackbone.contract.test.ts"

# Boundary: core-kernel must not import from app/ or server/
if rg -n --glob='core-kernel/src/**/*.ts' 'from\s+"(\.\./)+app/' core-kernel/src >/dev/null 2>&1; then
  echo "ERR_EVENT_BACKBONE_BOUNDARY: core-kernel imports app"
  exit 1
fi
if rg -n --glob='core-kernel/src/**/*.ts' 'from\s+"(\.\./)+server/' core-kernel/src >/dev/null 2>&1; then
  echo "ERR_EVENT_BACKBONE_BOUNDARY: core-kernel imports server"
  exit 1
fi

echo "OK: gate:event-backbone"
