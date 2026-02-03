# RFC — Phase11 / Wave3.1 — Clients Excel-like (APP)
Date: 2026-02-03
Status: APPROVED
Scope: APP business pages (clients) with governed stub port + UI grid

## Decision
Introduce a contract-first ClientsPort (v1) and wire /app/#/clients Page to a lightweight grid (no heavy deps).
Data source uses a stub adapter (in-memory) with telemetryInfo for correlation.

## Constraints
- No hardcoded APP nav arrays
- No cross-surface imports
- Observability correlation preserved
- No core-freeze-lts widening: no core-kernel edits; only app layer + ports in app/src/core/ports

## Next
Replace stub with real persistence via WriteGateway/VFS+domain rules, CP-controlled.

## Wave3.1.1 Addendum
- Replace empty stub-only flow with VFS-backed adapter (tenant scoped).
- Add create action to generate first real records (no hardcoded sample data).
- Storage key: clients/index.json in tenant namespace.
