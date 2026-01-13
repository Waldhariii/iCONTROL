# Changelog

## [P1.2] Cache observability — 2026-01-13
- Metrics: cardinality guardrails (refresh.dedup reason tagging)
- Governance: runtime audit surface for cache kill-switches
- Contracts: non-regression coverage added
- Gate: vitest-app.sh PASS (78 files / 197 tests)

Tags:
- release/p1.2-cache-observability
- baseline/main-p1.2-cache-observability

## [P1.3] Cache audit snapshot (read-only) — 2026-01-13
- Audit: optional JSON-safe snapshot helper on __cacheAudit (best-effort)
- UI: Developer page widget shows cache audit fields
- Contracts: cache-audit-snapshot.contract.test.ts
- Gate: vitest-app.sh PASS

Tags:
- release/p1.3-cache-audit-snapshot
- baseline/main-p1.3-cache-audit-snapshot

## [P1.4] Cache audit snapshot guarantee — 2026-01-13
- Governance: guarantee __cacheAudit.snapshot() always present after first cache touch
- Diagnostics: expose rt.__cacheAudit for runtime-first tests and UI/diagnostics
- Contracts: cache-audit-snapshot-guarantee.contract.test.ts
- Gate: vitest-app.sh PASS

Tags:
- release/p1.4-cache-audit-snapshot-guarantee
- baseline/main-p1.4-cache-audit-snapshot-guarantee

## P1.5 — System Cache Audit Panel (Read-only)
- System page: add Cache Audit section (read-only) with Copy JSON action.
- Contract: add JSON-safe snapshot contract for system panel.

## P1.6 — Cache Audit UI Consolidation (Redacted Copy + OBS)
- System page: Cache Audit section action row (Refresh + Copy redacted JSON) + OBS event.
- UI test: jsdom-based verification for clipboard copy.

## P1.7 — Cache Audit Policy Hardening (redactedSnapshot + stable keys)
- Policy: add `redactedSnapshot()` (JSON-safe) and stabilize audit snapshot keys for UI.
- System page: prefer `redactedSnapshot()` when present; fallback to `snapshot()`.
- OBS: add refresh event code for cache audit UI actions.
