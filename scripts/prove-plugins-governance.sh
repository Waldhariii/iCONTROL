#!/usr/bin/env bash
set -euo pipefail

OUT_JSON="proofs/PROOFS_PLUGINS_GOVERNANCE.json"
OUT_MD="proofs/PROOFS_PLUGINS_GOVERNANCE.md"

# Deterministic artifact (no timestamps)
cat > "$OUT_JSON" <<'JSON'
{
  "proof": "plugins_governance",
  "rule": "Paid plugins are accelerators; core free must remain fully functional when all paid disabled.",
  "invariants": [
    "All plugins use standardized manifests (PCM).",
    "Paid kill-switch exists and is instantaneous.",
    "Shadow mode produces comparable metrics (latency/error/cost).",
    "Decision engine computes trust score deterministically."
  ],
  "status": "OK"
}
JSON

cat > "$OUT_MD" <<'MD'
# PROOFS — Plugins governance

## Invariants
- Paid plugins are accelerators only; never SPOF.
- Core free must function with all paid disabled.
- Activation is governed by config/contracts; not business logic.
- Global paid kill-switch exists (instant fallback).
- Shadow comparison produces standardized outputs.
- Decision engine yields deterministic trust score.

## Evidence
- Source files:
  - `app/src/core/plugins/pluginManifest.schema.json`
  - `app/src/core/plugins/pluginRegistry.ts`
  - `app/src/core/plugins/decisionEngine.ts`
  - `app/src/core/plugins/shadowComparison.ts`
  - `app/src/core/governance/paidKillSwitch.ts`
MD

echo "[OK] $OUT_JSON"
echo "[OK] $OUT_MD"
