# CP Login Theme Editor

## Scope
- Applies only to `/cp/#/login`.
- No dependency on `/app` pages or logic.
- Overrides are runtime-only and do not mutate SSOT theme files.

## SSOT Theme Presets
- Source of truth: `app/src/pages/cp/ui/loginTheme/loginTheme.ts`.
- Presets: `midnightPurple`, `steelBlue`, `graphite`.
- Query override: `/cp/#/login?theme=<preset>`.

## Override Flow
- Runtime override lookup (preferred): `window.__ICONTROL_RUNTIME_CONFIG__.cpLoginThemeOverride`.
- Fallback: localStorage key `icontrol.cp.loginTheme.override.v1`.
- Merge strategy: deep merge tokens/effects into the preset.

## Editor Route
- `/cp/#/login-theme` (alias `/cp/#/theme-editor`).
- Page lists tokens with swatch previews and editor modal.
- Save/Reset/Import/Export are disabled in SAFE_MODE or for non-admin roles.

## Audit + SAFE_MODE
- Saves/imports/reset emit audit events via `app/src/core/audit/auditLog.ts`.
- SAFE_MODE blocks persistence automatically.

## Files
- `app/src/pages/cp/login-theme.ts` (editor UI).
- `app/src/pages/cp/login.css` (scoped login CSS).
- `app/src/pages/cp/login.ts` (CP login rendering + override apply).
- `app/src/pages/cp/ui/loginTheme/loginTheme.ts` (SSOT presets).
- `app/src/pages/cp/ui/loginTheme/loginTheme.override.ts` (override loader + merge).
