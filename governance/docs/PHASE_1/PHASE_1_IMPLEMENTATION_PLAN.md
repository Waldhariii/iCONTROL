# PHASE 1 — Write Gateway (Shadow) Implementation Plan

## Scope (Phase 1)
- Add a non-destructive Write Gateway interface (ports/adapters) under `app/src/core/write-gateway/`.
- Wire a single pilot write path (entitlements) in **shadow mode** only.
- Add a report-only coverage gate to surface write hotspots.

## What Was Added
- `app/src/core/write-gateway/` contracts + gateway + policy/audit hooks + legacy adapter.
- Shadow routing for `ENTITLEMENTS_SET` in `app/src/core/entitlements/index.ts`.
- Feature flag (SSOT): `write_gateway_shadow` (default OFF) in `app/src/policies/feature_flags.default.json`.
- Gate: `gate:write-gateway-coverage` (report-only).

## How to Enable Shadow (Pilot)
- Set `write_gateway_shadow` to `ON` or `ROLLOUT` in feature flags.
- Default remains `OFF` (legacy path only).

## First Command(s)
- `ENTITLEMENTS_SET` (writes via legacy adapter when shadow is ON).

## Logging / Proof
- Gateway logs (no PII): `WRITE_GATEWAY_EXEC`, `WRITE_GATEWAY_POLICY_*`, `WRITE_GATEWAY_AUDIT_*`.
- Shadow fallback logs: `WRITE_GATEWAY_SHADOW_FALLBACK`, `WRITE_GATEWAY_SHADOW_ERROR`.
- Report: `docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_gateway_coverage_report.md`.
