# ADR-007 — Cleanroot policy

Date: 2026-02-01  
Status: Accepted  
Owners: CTO / Platform

## Context
Build outputs and transient logs at repo root create confusion and packaging risk.

## Decision
Repo root must remain clean.
Forbidden at root: `dist/`, rollback archives, ad-hoc audit logs, `.DS_Store`.
Build outputs must live under `app/dist/**`, `server/dist/**`, or `_artifacts/**`.

## Rationale
Reduces human error, accidental packaging, and repo noise.

## Consequences
- (+) Professional repo hygiene
- (-) Requires adjusting scripts that previously wrote to root `dist/`

## Enforcement
- gate:root-clean
- scripts aligned to output to app/dist or _artifacts

## Rollback
Superseding ADR required; otherwise keep cleanroot strict.
