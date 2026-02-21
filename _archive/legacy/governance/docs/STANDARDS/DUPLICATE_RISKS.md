# DUPLICATE_RISKS (Phase 0.5)

Generated: 2026-01-25
Scope: iCONTROL repo (structural duplicate risks)

## Structural duplicates (central responsibility implemented more than once)

| Zone | Files (evidence) | Severity | Strategy |
| --- | --- | --- | --- |
| Audit | `app/src/core/audit/auditLog.ts` (localStorage), `modules/core-system/subscription/AuditTrail.ts` (in-memory), `app/src/core/studio/audit/*` (studio audit subsystem) | P1 | Centralize via Audit Ledger interface; wrap existing emitters/adapters; keep UI read-only by default. |
| RBAC / Access policy | `app/src/runtime/rbac.ts`, `app/src/core/governance/rbac/policy.ts`, `runtime/configs/permissions/rbac.json` | P1 | Define single Policy Engine (RBAC/ABAC) and expose runtime adapter; deprecate direct role checks in UI. |
| Route governance | `runtime/configs/ssot/ROUTE_CATALOG.json` vs router allowlists/constants in `app/src/router.ts` | P1 | Make ROUTE_CATALOG the only source; keep router constants as generated cache. |
| Entitlements vs Subscription | `app/src/core/entitlements/*` (localStorage) vs `modules/core-system/subscription/*` (write-model + resolver) | P1 | Keep subscription as source; expose entitlements read-model; wrap localStorage layer as fallback adapter only. |
| SAFE_MODE | `app/src/core/runtime/safeMode.ts` (local flag) vs `app/src/policies/safe_mode.*` vs UI safeMode (`modules/core-system/ui/frontend-ts/pages/_shared/safeMode.ts`) | P1 | Single SAFE_MODE Engine that publishes canonical state; UI reads from single source. |
| UI Theme/Tokens | `runtime/configs/ssot/design.tokens.json`, `app/src/core/ui/themeManager.ts`, `app/src/styles/STYLE_ADMIN_FINAL.css` | P1 | Keep design.tokens as SSOT; reduce themeManager to adapter/no-op; STYLE_ADMIN_FINAL consumes tokens only. |
| Feature flags | `app/src/policies/feature_flags.*` vs UI helper `modules/core-system/ui/frontend-ts/shared/featureFlags.ts` | P2 | Centralize flag resolution in policy layer; UI helper should read decisions only. |
| Storage namespace rules | `app/src/core/runtime/storageNs.ts` (nsKey) vs ad-hoc localStorage in multiple modules | P2 | Introduce Write Gateway enforcing nsKey for all writes; wrap existing direct writes. |

## Notes
- Severity P1 = high risk of divergence if a change is made in one system but not the other.
- Severity P2 = medium risk; converge via adapters without breaking behavior.

