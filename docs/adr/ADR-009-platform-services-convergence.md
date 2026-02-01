# ADR-009 — Platform-services / core-kernel convergence policy

Date: 2026-02-01  
Status: Accepted  
Owners: CTO / Platform

## Context
Parallel kernel folders exist (`platform-services/`, `core-kernel/`) alongside canonical `app/src/platform/**`.

## Decision
No new imports from `platform-services/**` or `core-kernel/**` into browser runtime, except an explicit temporary allowlist:
- `app/src/main.ts` may import `platform-services/**` temporarily.

Target: converge required primitives into `app/src/platform/**` via a controlled migration (ADR per migration).

## Rationale
Avoids breaking current runtime while preventing further drift.

## Consequences
- (+) Stable today, controlled convergence tomorrow
- (-) Temporary exception requires discipline and tracking

## Enforcement
- gate:boundaries-map (with allowlist)
- documentation in STRUCTURE_BOUNDARIES.md

## Rollback
If we choose the opposite (make platform-services canonical), supersede ADR-001 and remove allowlist concept.
