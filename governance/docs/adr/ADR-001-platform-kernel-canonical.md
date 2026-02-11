# ADR-001 — Canonical runtime kernel location

Date: 2026-02-01  
Status: Accepted  
Owners: CTO / Platform

## Context
Multiple kernel-like layers existed historically (`core-kernel/`, `platform-services/`, `app/src/core`).
This increases cognitive load and import ambiguity.

## Decision
The canonical runtime kernel is `app/src/platform/**`.
New runtime governance, security, policies, and platform primitives live there.

## Rationale
A single canonical kernel reduces drift, prevents parallel abstractions, and aligns with gates/SSOT.

## Consequences
- (+) Clear ownership and import direction
- (-) Requires gradual convergence/migration from older kernel-like folders

## Enforcement
- Boundaries gates (no forbidden imports)
- SSOT verification (verify:ssot)

## Rollback
Introduce a superseding ADR with a migration plan; do not move directories without gates + rollback.
