#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

need() { test -f "$ROOT/$1" || { echo "ERR_POLICY_LAYER_MISSING: $1"; exit 1; }; }

need "core-kernel/src/policy/policyEngine.contract.ts"
need "platform-services/policy/policyEngine.impl.ts"

echo "[gate][OK] policy layer contract+impl present."
