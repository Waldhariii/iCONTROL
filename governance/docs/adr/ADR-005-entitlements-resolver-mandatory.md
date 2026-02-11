# ADR-005 — Entitlements resolver (capabilities) is mandatory

Date: 2026-02-01  
Status: Accepted  
Owners: CTO / Platform

## Context
Scattered tier/subscription checks create drift and inconsistent authorization outcomes.

## Decision
`platform/entitlements/resolveCapabilities()` is the single SSOT for subscription feature mapping.
Policy decisions consume capabilities, not tiers/config directly.

## Rationale
Central mapping improves maintainability, testability, and product packaging (free vs paid).

## Consequences
- (+) Clear product packaging, fewer regressions
- (-) Initial migration effort for scattered checks

## Enforcement
- gate:entitlements-kernel (prevents runtimeConfig reads/tier compares outside kernel)
- Policy contract tests

## Rollback
Supersede with a new resolver strategy (e.g., remote entitlements service) preserving capabilities interface.
