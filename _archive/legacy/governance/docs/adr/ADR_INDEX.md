# ADR Index — iCONTROL

Purpose: Architecture Decision Records (ADRs) are the SSOT of *why* we built things this way.
They prevent drift, reduce regressions, and make platform decisions auditable.

## Status legend
- **Accepted**: current SSOT
- **Superseded**: replaced by a newer ADR
- **Proposed**: drafted, not yet enforced as SSOT

## ADRs
- ADR-001 — Canonical runtime kernel location (`app/src/platform/**`) — **Accepted**
- ADR-002 — Surfaces isolation + legacy pages quarantine (`app/src/surfaces/**`, no `app/src/pages/**`) — **Accepted**
- ADR-003 — Write Gateway mandatory for writes (no direct storage/network writes) — **Accepted**
- ADR-004 — Runtime config is runtime-only, schema validated, fail-closed (Node-only loader) — **Accepted**
- ADR-005 — Entitlements resolver (capabilities) is mandatory + no scattered tier checks — **Accepted**
- ADR-006 — Node/Browser boundary enforced (no Node core in browser build) — **Accepted**
- ADR-007 — Cleanroot policy (no root dist/rollback/log artefacts) — **Accepted**
- ADR-008 — Theme Manager uses semantic tokens only (no hardcoded colors; warn→strict) — **Accepted**
- ADR-009 — Platform services / core-kernel convergence policy (temporary allowlist + migration path) — **Accepted**
