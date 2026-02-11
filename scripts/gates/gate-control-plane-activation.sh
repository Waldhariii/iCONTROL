#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REG="$ROOT/apps/control-plane/src/platform/controlPlane/activationRegistry.ts"

if [[ ! -f "$REG" ]]; then
  echo "ERR_CP_ACTIVATION_REGISTRY_MISSING: ${REG}"
  exit 1
fi

# Extract keys from the registry list (simple heuristic, stable)
keys="$(rg -n --no-filename '\{ key: "([^"]+)"' "$REG" | sed -E 's/.*\{ key: "([^"]+)".*/\1/' || true)"

if [[ -z "${keys}" ]]; then
  echo "ERR_CP_ACTIVATION_KEYS_EMPTY: no keys found"
  exit 1
fi

dup="$(printf "%s\n" "$keys" | sort | uniq -d || true)"
if [[ -n "${dup}" ]]; then
  echo "ERR_CP_ACTIVATION_DUP_KEYS:"
  printf "%s\n" "$dup"
  exit 1
fi

echo "OK: gate:control-plane-activation (keys=$(printf "%s\n" "$keys" | wc -l | tr -d ' '))"
