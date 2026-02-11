# PHASE 2.4 BACKLOG — write surfaces triage (report-only)

## Inputs (SSOT)
- Surface map: `docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_surface_map_report.md`
- Coverage: `docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_gateway_coverage_report.md`

## Top offenders (Top 50)

| Rank | Hits | Bucket | In coverage | File | Recommendation |
|---:|---:|---|---|---|---|
| 1 | 10 | OTHER | no | `app/src/policies/cache.registry.ts` | LOW: evaluate |
| 2 | 9 | CORE_RUNTIME | no | `app/src/core/runtime/runtimeConfig.ts` | HIGH: prioritize canonical write points + SSOT gating |
| 3 | 9 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx` | MED: module isolation; prefer write gateway single entrypoint |
| 4 | 7 | CP_UI | no | `app/src/pages/cp/views/users.ts` | MED: UI writes; keep SSR guards + legacy-first |
| 5 | 5 | CORE_RUNTIME | no | `app/src/core/entitlements/index.ts` | HIGH: prioritize canonical write points + SSOT gating |
| 6 | 5 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/dossiers/model.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 7 | 4 | OTHER | no | `app/src/__tests__/safe-mode.enforcement-wiring.contract.test.ts` | LOW: evaluate |
| 8 | 4 | CORE_RUNTIME | no | `app/src/core/ui/themeManager.ts` | HIGH: prioritize canonical write points + SSOT gating |
| 9 | 3 | CORE_RUNTIME | no | `app/src/core/audit/auditLog.ts` | HIGH: prioritize canonical write points + SSOT gating |
| 10 | 3 | CP_UI | no | `app/src/pages/cp/ui/loginTheme/loginTheme.override.ts` | MED: UI writes; keep SSR guards + legacy-first |
| 11 | 2 | PLATFORM_SERVICE | no | `platform-services/branding/brandService.ts` | HIGH: service boundary; tighten payload + correlation scope |
| 12 | 2 | MODULES | no | `modules/core-system/subscription/SubscriptionRegistry.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 13 | 2 | MODULES | no | `modules/core-system/subscription/SubscriptionStore.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 14 | 2 | MODULES | no | `modules/core-system/subscription/FileSubscriptionStore.node.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 15 | 2 | OTHER | no | `app/src/__tests__/app-cp-guard.app-blocks-cp.contract.test.ts` | LOW: evaluate |
| 16 | 2 | CORE_RUNTIME | no | `app/src/core/entitlements/storage.ts` | HIGH: prioritize canonical write points + SSOT gating |
| 17 | 2 | OTHER | no | `app/src/__tests__/subscription-persistence.contract.test.ts` | LOW: evaluate |
| 18 | 2 | CORE_RUNTIME | no | `app/src/core/runtime/safeMode.ts` | HIGH: prioritize canonical write points + SSOT gating |
| 19 | 2 | OTHER | no | `app/src/__tests__/runtime-config-endpoint.shim.flag-on.contract.test.ts` | LOW: evaluate |
| 20 | 2 | OTHER | no | `app/src/__tests__/app-cp-guard.cp-blocks-app.contract.test.ts` | LOW: evaluate |
| 21 | 2 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/activation/index.tsx` | MED: module isolation; prefer write gateway single entrypoint |
| 22 | 2 | CORE_RUNTIME | no | `app/src/core/studio/datasources/router.ts` | HIGH: prioritize canonical write points + SSOT gating |
| 23 | 2 | CORE_RUNTIME | no | `app/src/core/ui/dataTable.ts` | HIGH: prioritize canonical write points + SSOT gating |
| 24 | 2 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/system/sections/cache-audit.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 25 | 1 | PLATFORM_SERVICE | no | `platform-services/security/auth/localAuth.ts` | HIGH: service boundary; tighten payload + correlation scope |
| 26 | 1 | MODULES | no | `modules/core-system/subscription/ProviderSync.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 27 | 1 | CP_UI | no | `app/src/pages/cp/login-theme.ts` | MED: UI writes; keep SSR guards + legacy-first |
| 28 | 1 | OTHER | no | `app/src/__tests__/cp-login.session-scope.contract.test.ts` | LOW: evaluate |
| 29 | 1 | OTHER | no | `app/src/__tests__/storage-namespace.contract.test.ts` | LOW: evaluate |
| 30 | 1 | CORE_RUNTIME | no | `app/src/core/control-plane/storage.ts` | HIGH: prioritize canonical write points + SSOT gating |
| 31 | 1 | OTHER | no | `app/src/__tests__/app-login.session-scope.contract.test.ts` | LOW: evaluate |
| 32 | 1 | OTHER | no | `app/src/__tests__/toolbox.test.ts` | LOW: evaluate |
| 33 | 1 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/account/index.test.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 34 | 1 | OTHER | no | `app/src/__tests__/access-guard.contract.test.ts` | LOW: evaluate |
| 35 | 1 | OTHER | no | `app/src/__tests__/auditlog-entitlements.contract.test.ts` | LOW: evaluate |
| 36 | 1 | OTHER | no | `app/src/__tests__/cache-bounds-hardening.contract.test.ts` | LOW: evaluate |
| 37 | 1 | CORE_RUNTIME | no | `app/src/core/runtime/tenant.ts` | HIGH: prioritize canonical write points + SSOT gating |
| 38 | 1 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/verification/index.test.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 39 | 1 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/dossiers/index.test.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 40 | 1 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/_shared/regression-wall.test.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 41 | 1 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/dossiers/sections/list.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 42 | 1 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/dashboard/index.test.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 43 | 1 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/developer/index.test.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 44 | 1 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/_shared/safe-mode-write.test.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 45 | 1 | CORE_RUNTIME | no | `app/src/core/studio/datasources/memory.ts` | HIGH: prioritize canonical write points + SSOT gating |
| 46 | 1 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/settings/branding.test.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 47 | 1 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/users/index.test.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 48 | 1 | CORE_RUNTIME | no | `app/src/core/studio/audit/logger.ts` | HIGH: prioritize canonical write points + SSOT gating |
| 49 | 1 | MODULES | no | `modules/core-system/ui/frontend-ts/pages/logs/index.ts` | MED: module isolation; prefer write gateway single entrypoint |
| 50 | 1 | OTHER | no | `app/src/localAuth.ts` | LOW: evaluate |

## Next action (deterministic)
- Pick **one** file from the Top list.
- Wire/normalize with the canonical WriteGateway shadow block (legacy-first, SSR-safe, NO-OP adapter, flag OFF by default).
- Proof pack: gate:ssot, gate:ssot:paths, build:cp, build:app.
- Commit scoped (single file + flags) and keep reports out of the commit.