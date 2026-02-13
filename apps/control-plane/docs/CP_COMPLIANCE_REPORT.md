# CP Compliance Report

- Generated: `2026-01-29T12:07:24-0500`
- Workspace: `/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/app`

## Guardrails

### cp:devonly:verify
```
[devonly-doc][OK] no drift
```

### cp:guard (no inline styles)
```
[guard] scan CP inline styles…
[guard][OK] CP inline styles: none.
```

## Diagnostic snapshot (DEV-only surface)

Contracted marker: `ICONTROL_DIAGNOSTIC_V1`

```json
{
  "ok": true,
  "ts": 1769706444571,
  "devOnly": {
    "allowed": false,
    "cpRoutes": [],
    "cpRoutesCount": 0
  }
}
```

## Test suite (gate:cp)

```
[devonly-doc][OK] no drift
[guard] scan CP inline styles…
[guard][OK] CP inline styles: none.

[1m[46m RUN [49m[22m [36mv4.0.16 [39m[90m/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/app[39m

 [32m✓[39m src/__tests__/toolbox.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 147[2mms[22m[39m
 [32m✓[39m src/__tests__/router-system-logs.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 150[2mms[22m[39m
 [32m✓[39m src/__tests__/cache-refresh-meta-marker.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 134[2mms[22m[39m
 [32m✓[39m src/__tests__/runtime-no-import-sideeffects.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 190[2mms[22m[39m
 [32m✓[39m src/__tests__/no-import-sideeffects-critical.contract.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 230[2mms[22m[39m
 [32m✓[39m src/__tests__/cache-metrics-cardinality.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[33m 392[2mms[22m[39m
     [33m[2m✓[22m[39m does not create unbounded metric keys for refresh.dedup reason tagging [33m 391[2mms[22m[39m
 [32m✓[39m src/__tests__/cache-singleflight-refresh-lru.contract.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 110[2mms[22m[39m
[90mstdout[2m | src/__tests__/app-cp-guard.cp-blocks-app.contract.test.ts[2m > [22m[2mAPP/CP guard (contract) — CP blocks APP routes[2m > [22m[2mredirects to /cp/#/dashboard when CP tries to hit APP
[22m[39mCLIENT_STYLE_GUARD_INIT { kind: [32m'APP'[39m }
💡 Pour diagnostiquer, tapez dans la console: __ICONTROL_DIAGNOSTIC__()

[90mstdout[2m | src/__tests__/app-cp-guard.app-blocks-cp.contract.test.ts[2m > [22m[2mAPP/CP guard (contract) — APP blocks CP routes[2m > [22m[2mredirects to /app/#/dashboard when APP tries to hit CP
[22m[39mCLIENT_STYLE_GUARD_INIT { kind: [32m'APP'[39m }
💡 Pour diagnostiquer, tapez dans la console: __ICONTROL_DIAGNOSTIC__()

 [32m✓[39m src/__tests__/app-cp-guard.app-blocks-cp.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 276[2mms[22m[39m
 [32m✓[39m src/__tests__/app-cp-guard.cp-blocks-app.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 277[2mms[22m[39m
 [32m✓[39m src/__tests__/activation-manual.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 81[2mms[22m[39m
 [32m✓[39m src/__tests__/cache-refresh-metrics.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 74[2mms[22m[39m
 [32m✓[39m src/__tests__/cache-refresh-metrics-shape.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 58[2mms[22m[39m
 [32m✓[39m src/__tests__/cache-refresh-metrics-no-throw.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 52[2mms[22m[39m
 [32m✓[39m src/__tests__/circuit-breaker.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 63[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/developer/index.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 70[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/logs/index.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 128[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/system/index.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 138[2mms[22m[39m
 [32m✓[39m src/__tests__/cache-registry.contract.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 47[2mms[22m[39m
 [32m✓[39m src/__tests__/policies-killswitch.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 37[2mms[22m[39m
 [32m✓[39m src/__tests__/ssot-css-entrypoint.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 25[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 55[2mms[22m[39m
 [32m✓[39m src/__tests__/cache-refresh-dedup-reason.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 28[2mms[22m[39m
 [32m✓[39m src/__tests__/cache-bounds-hardening.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 27[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/dashboard/index.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 48[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/system/sections/cache-audit.ui.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 43[2mms[22m[39m
 [32m✓[39m src/__tests__/runtime-config.ssot.endpoint.contract.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/settings/index.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 32[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/_shared/regression-wall.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 49[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/users/index.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 32[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/account/index.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 32[2mms[22m[39m
 [32m✓[39m src/__tests__/runtime-import-hygiene.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m src/__tests__/cache-swr-killswitch.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m src/__tests__/runtime-config-endpoint.shim.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/blocked/index.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m src/__tests__/control-plane-governance-audit.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/_shared/role-policy.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/verification/index.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 30[2mms[22m[39m
 [32m✓[39m src/__tests__/audit-metrics-integration.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m src/__tests__/control-plane-forcedflags-audit.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/_shared/recommendations.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 29[2mms[22m[39m
 [32m✓[39m src/__tests__/entitlements-manual.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/control-plane-audit-scopes-registry.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m src/__tests__/entitlements-api.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m src/__tests__/safe-mode.enforce.contract.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m src/__tests__/safe-mode.enforcement-wiring.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m src/__tests__/control-plane-audit-shape.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m src/core/studio/runtime/plan.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/safe-mode.runtime.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m src/core/studio/engine/internal/html-guards.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/control-plane-audit-schema-version.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/subscription-guards.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m src/__tests__/safe-mode.write-guards.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m src/__tests__/auditlog-entitlements.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/access-guard.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/audit-emit-helper.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m
[90mstderr[2m | src/__tests__/devonly-route-guard.contract.test.ts[2m > [22m[2mDEV-only route guard SSOT (contract)[2m > [22m[2mexports guardDevOnlyRoute and returns string|null
[22m[39mWARN_DEVONLY_ROUTE_BLOCKED { scope: [32m'cp.router'[39m, route: [32m'x'[39m, marker: [32m'M'[39m }

 [32m✓[39m src/__tests__/devonly-route-guard.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m src/__tests__/audit-trace-context.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m src/__tests__/audit-redaction.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m src/core/studio/runtime/execute.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m src/__tests__/storage-namespace.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/ui-showcase.router-devonly.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m src/__tests__/cp-no-inline-styles.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m src/__tests__/subscription-persistence.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/control-plane-featureflags-alias.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m src/__tests__/runtime-config-endpoint.shim.flag-on.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m src/__tests__/audit.adapter.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/studio-runtime.mkRuntime.invariants.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m src/__tests__/cache-audit-snapshot-system-panel.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/cache-audit-snapshot.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/subscription-kernel.contract.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/core/studio/runtime/pipeline.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/feature-flags-enforce.contract.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/metrics-registry.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/cache-audit-snapshot-guarantee.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/version-policy-enforce.contract.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/subscription-registry.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/dev/diagnostic.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/core/studio/runtime/execute.rbac.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/studio-runtime.mkRuntime.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/runtime-config-endpoint.shim.flag-off-default.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m src/__tests__/no-direct-location-hash.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/feature-flags-loader.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/studio-runtime.audit-shape.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/dev/showcase.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m src/__tests__/devonly-routes-docgen.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m src/__tests__/cache-killswitch-audit.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/auth-cookie.samesite-strict.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/ui-showcase.runtime-devonly.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/cp-users-inline-styles.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m src/__tests__/no-import-sideeffects.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m src/__tests__/app-login.session-scope.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/devonly-routes.ssot.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/version-policy-boot.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/control-plane-capabilities.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/feature-flags-schema.contract.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/version-policy-runtime.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/ui-entitlements-pages.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/feature-flags-boot.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m src/__tests__/version-policy-loader.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/feature-flags-governance.contract.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/diagnostic.export.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/studio-runtime.factory.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/ui-modal.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m src/__tests__/login-entrypoint.ssot.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/_shared/recommendations.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/theme-css-vars.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m src/__tests__/ui-showcase.dev-only.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/__tests__/feature-flags-runtime.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m src/__tests__/ui-entitlements-consumption.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/__tests__/error-codes.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m src/__tests__/runtime-exports-ssot.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m src/__tests__/studio-runtime.safe-mode.factory.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m src/__tests__/runtime-config-endpoint.devonly.guard.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m src/__tests__/diagnostic.devonly-routes.contract.test.ts [2m([22m[2m2 tests[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/_shared/recommendations.ctx.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m
 [32m✓[39m src/__tests__/cp-login.session-scope.contract.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m ../modules/core-system/ui/frontend-ts/pages/_shared/safe-mode-write.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 2[2mms[22m[39m

[2m Test Files [22m [1m[32m120 passed[39m[22m[90m (120)[39m
[2m      Tests [22m [1m[32m259 passed[39m[22m[90m (259)[39m
[2m   Start at [22m 12:07:25
[2m   Duration [22m 5.29s[2m (transform 2.89s, setup 1.10s, import 3.55s, tests 3.90s, environment 12.37s)[22m

```

