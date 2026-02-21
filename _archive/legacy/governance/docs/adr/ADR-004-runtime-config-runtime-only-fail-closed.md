# ADR-004 — Runtime config is runtime-only, schema validated, fail-closed

Date: 2026-02-01  
Status: Accepted  
Owners: CTO / Platform

## Context
Subscription/entitlements config must be runtime-only (not tracked in git) and safe in production.

## Decision
`.icontrol_subscriptions.json` is runtime-only (ignored by git).
An example file is tracked. Runtime config is schema validated; prod is fail-closed.
Node-only loader lives under `app/src/platform/runtimeConfig/node/**`.
Browser reads only a snapshot (no fs/path).

## Rationale
Prevents secrets/config drift from being committed; ensures deterministic behavior in prod.

## Consequences
- (+) Safer prod operation, clear auditability
- (-) Requires a serving/snapshot strategy for browser runtime

## Enforcement
- gate:runtime-config
- Node/Browser boundary gate
- Example SSOT gate

## Rollback
A superseding ADR may move config to a service, but must preserve fail-closed semantics.
