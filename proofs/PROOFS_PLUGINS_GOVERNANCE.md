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
