# PATHS_CANONICAL.md

## SSOT Paths (DO NOT GUESS)
- Flags: `app/src/policies/feature_flags.default.json`
- Reports:
  - Surface map: `docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_surface_map_report.md`
  - Gateway coverage: `docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_gateway_coverage_report.md`
- Hooks:
  - Pre-commit: `.githooks/pre-commit`
- Gates (core):
  - SSOT paths: `scripts/gates/gate-ssot-paths.mjs`
  - Write surface map: `scripts/gates/gate-write-surface-map.mjs`
  - Write gateway coverage: `scripts/gates/gate-write-gateway-coverage.mjs`

## Reports (generated, never edited)
- `docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_surface_map_report.md`
- `docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_gateway_coverage_report.md`

## Write Pilots – Phase 1
- runtimeConfig: `app/src/core/runtime/runtimeConfig.ts`
- auditLog: `app/src/core/audit/auditLog.ts`
- entitlements storage: `app/src/core/entitlements/storage.ts`
- tenant: `app/src/core/runtime/tenant.ts`
- theme: `app/src/core/ui/themeManager.ts`
- safeMode: `app/src/core/runtime/safeMode.ts`
- loginTheme override: `app/src/pages/cp/ui/loginTheme/loginTheme.override.ts`
- users: `app/src/pages/cp/views/users.ts`
- brandService: `platform-services/branding/brandService.ts`
- localAuth: `platform-services/security/auth/localAuth.ts`
- ui catalog: `app/src/core/ui/catalog/index.ts`
- cp storage: `app/src/core/control-plane/storage.ts`
- FileSubscriptionStore: `modules/core-system/subscription/FileSubscriptionStore.node.ts`

## Gates & Hooks
- Gates directory: `scripts/gates`
- SSOT helper: `scripts/ssot/paths.mjs`
- Pre-commit hook: `.githooks/pre-commit`

## Roots
- `app/`
- `modules/`
- `platform-services/`
- `server/`
- `scripts/`
- `docs/`

## Forbidden assumptions
- Never assume repo root or paths; always read from this file.
- Never use `rg -n` to resolve paths; use `rg --files` or SSOT JSON below.
- Never hardcode report paths in scripts; use SSOT JSON below.
- Never commit report outputs unless explicitly requested.

```json
{
  "flags": "app/src/policies/feature_flags.default.json",
  "reports": {
    "surfaceMap": "docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_surface_map_report.md",
    "coverage": "docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_gateway_coverage_report.md"
  },
  "gates": {
    "ssotPaths": "scripts/gates/gate-ssot-paths.mjs",
    "surfaceMap": "scripts/gates/gate-write-surface-map.mjs",
    "coverage": "scripts/gates/gate-write-gateway-coverage.mjs"
  },
  "hooks": {
    "preCommit": ".githooks/pre-commit"
  },
  "roots": [
    "app/src",
    "modules",
    "platform-services",
    "server"
  ],
  "pilotsPhase1": {
    "runtimeConfig": "app/src/core/runtime/runtimeConfig.ts",
    "auditLog": "app/src/core/audit/auditLog.ts",
    "entitlementsStorage": "app/src/core/entitlements/storage.ts",
    "tenant": "app/src/core/runtime/tenant.ts",
    "theme": "app/src/core/ui/themeManager.ts",
    "safeMode": "app/src/core/runtime/safeMode.ts",
    "loginThemeOverride": "app/src/pages/cp/ui/loginTheme/loginTheme.override.ts",
    "users": "app/src/pages/cp/views/users.ts",
    "brandService": "platform-services/branding/brandService.ts",
    "localAuth": "platform-services/security/auth/localAuth.ts",
    "uiCatalog": "app/src/core/ui/catalog/index.ts",
    "cpStorage": "app/src/core/control-plane/storage.ts",
    "fileSubscriptionStore": "modules/core-system/subscription/FileSubscriptionStore.node.ts"
  }
}
```
