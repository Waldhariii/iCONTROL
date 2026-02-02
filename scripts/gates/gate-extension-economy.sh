#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

need() { test -f "$ROOT/$1" || { echo "ERR_EXTENSION_ECON_MISSING: $1"; exit 1; }; }

need "core-kernel/src/extensions/marketplace/extensionRegistry.contract.ts"
need "core-kernel/src/extensions/marketplace/extensionRegistry.ts"
need "core-kernel/src/security/capabilities/capabilities.contract.ts"
need "core-kernel/src/security/capabilities/capabilities.ts"

echo "[gate][OK] extension economy scaffold present."
