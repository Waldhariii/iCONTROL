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
