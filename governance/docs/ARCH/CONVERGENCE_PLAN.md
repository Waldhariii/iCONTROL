# CONVERGENCE_PLAN (Phase 0.5)

Generated: 2026-01-25
Scope: iCONTROL repo (non-destructive convergence plan)

## Centralize (target singletons)

1) Write Gateway (single entry for writes)
- Target interface: `governance/docs/WRITE_GATEWAY_CONTRACT.md`
- Scope: localStorage (audit/entitlements/runtime config), FileSubscriptionStore, feature flags, brand, tenant matrix
- Strategy: introduce gateway, then route existing writes via adapters; keep behavior identical.

2) Audit Ledger (single audit sink)
- Source candidates: `app/src/policies/audit.emit.ts`, `app/src/core/audit/auditLog.ts`, `app/src/core/studio/audit/*`, `modules/core-system/subscription/AuditTrail.ts`
- Strategy: keep emit signature; provide adapters for localStorage + in-memory + future persistent store; unify payload envelope.

3) Policy Engine (RBAC/ABAC + guards)
- Source candidates: `app/src/core/governance/rbac/policy.ts`, `runtime/configs/permissions/rbac.json`, `app/src/runtime/rbac.ts`, `app/src/core/control-plane/guards/pageAccessGuard.ts`
- Strategy: create policy service that reads runtime/configs/ssot and exposes `authorize` + `guardRouteAccess` consistently.

4) SAFE_MODE Engine (single state + enforcement)
- Source candidates: `app/src/core/runtime/safeMode.ts`, `app/src/policies/safe_mode.*`, `modules/core-system/ui/frontend-ts/pages/_shared/safeMode.ts`
- Strategy: publish one canonical SAFE_MODE state; make UI and write-guards read from it.

5) UI SSOT (tokens → CSS vars → components)
- Source candidates: `runtime/configs/ssot/design.tokens.json`, `app/src/styles/STYLE_ADMIN_FINAL.css`, `app/src/core/ui/themeManager.ts`, `app/src/core/ui/registry.ts`
- Strategy: tokens as SSOT; CSS consumes tokens; themeManager becomes adapter/no-op (or deterministic CP-only application).

## Wrap (adapters around existing implementations)

- localStorage audit log: wrap `appendAuditEvent()` behind Audit Ledger adapter.
- entitlements localStorage: wrap `saveEntitlements()` behind Write Gateway with audit + safe mode checks.
- FileSubscriptionStore: expose via Write Gateway adapter (non-breaking, same file layout).
- UI feature flag helper: route to feature flag decisions published by policy runtime.

## Deprecate (phase-out with dates)

- Direct localStorage writes outside Write Gateway (audit, entitlements, runtime config, brand) → deprecate after gateway adapter coverage.
- Router hardcoded allowlists in `app/src/router.ts` once ROUTE_CATALOG enforcement is stable.
- themeManager direct applyTheme (only after tokens + CSS are authoritative).
- InMemoryAuditTrail for subscription (replace with persistent audit sink adapter).

## Do Not Touch (stability-critical)

- Existing gates and CI workflows: `.githooks/*`, `scripts/gates/*`, `.github/workflows/*`.
- SSOT files already in use: `runtime/configs/ssot/ROUTE_CATALOG.json`, `runtime/configs/ssot/TENANT_FEATURE_MATRIX.json`, `runtime/configs/ssot/CAPABILITY_STATUS.json` (only update via governed process).
- Existing UI SSOT registry and gates: `app/src/core/ui/registry.ts`, `scripts/gates/gate-ui-*`.

## Execution order (locked phases)

1) Phase 0.5 (current): inventory + duplicate risks + convergence plan (no code).
2) Phase 1: introduce Write Gateway adapter + logging (read-only pass-through).
3) Phase 2: route all write paths through gateway; add audit + SAFE_MODE enforcement.
4) Phase 3: unify Policy Engine (RBAC + tenant matrix) and enable pageAccessGuard.
5) Phase 4: unify Audit Ledger and deprecate duplicates.
6) Phase 5: UI SSOT consolidation (tokens → CSS vars → components) with gates as blockers.

## Go / No-Go conditions

- Do not proceed to Phase 1 unless Phase 0.5 docs are present and gates pass (`npm run gate:ssot`, `npm run build:cp`, `npm run build:app`).
- If any item is unknown, record it explicitly and create a follow-up investigation task (no coding).

