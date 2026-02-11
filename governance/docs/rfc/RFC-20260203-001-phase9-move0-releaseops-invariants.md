# Phase9 Move0 — ReleaseOps invariants gate (catalog + governance marker)

## Why
We want deterministic productization invariants so release-train stays stable:
- MODULE_CATALOG schema/version enforced
- module manifest non-empty
- deterministic sort
- governance marker present

## What
- scripts/gates/check-releaseops-invariants.mjs
- scripts/gates/gate-releaseops-invariants.sh
- app/src/__tests__/releaseops-invariants.contract.test.ts
- npm script: gate:releaseops-invariants

## Rollback
Remove the gate scripts + test + npm script entry. No runtime impact.
