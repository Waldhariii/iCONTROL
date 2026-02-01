# ADR-002 — Surfaces isolation; legacy pages quarantined

Date: 2026-02-01  
Status: Accepted  
Owners: CTO / Platform

## Context
Legacy `app/src/pages/**` creates hidden runtime dependencies and cross-page coupling.

## Decision
Only isolated surfaces under `app/src/surfaces/**` are runtime pages.
Legacy pages remain quarantined and must not become runtime dependencies.

## Rationale
Isolated surfaces reduce regressions and enable module/page activation without cross-coupling.

## Consequences
- (+) Predictable routing & page boundaries
- (-) Requires deliberate migration of any valuable legacy page logic

## Enforcement
- Surfaces-only gates
- No src/pages deps gates
- Cross-surface import gate

## Rollback
A future ADR may reintroduce an alternate routing system, but must preserve isolation.
