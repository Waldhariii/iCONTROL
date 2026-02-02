#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

need() { test -f "$ROOT/$1" || { echo "ERR_AI_LAYER_MISSING: $1"; exit 1; }; }

need "platform-services/ai/orchestrator/aiProvider.contract.ts"
need "platform-services/ai/orchestrator/orchestrator.ts"

echo "[gate][OK] AI orchestration scaffold present."
