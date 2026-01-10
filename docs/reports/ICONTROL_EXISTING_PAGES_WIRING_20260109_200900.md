# iCONTROL — Main System Pages Wiring Report

## Pages created (isolated modules)
- modules/core-system/ui/frontend-ts/pages/users
- modules/core-system/ui/frontend-ts/pages/account
- modules/core-system/ui/frontend-ts/pages/developer
- modules/core-system/ui/frontend-ts/pages/verification

## Entrypoints + RBAC/SAFE_MODE
- users: `renderUsers` + RBAC role allowlist + SAFE_MODE gate in `modules/core-system/ui/frontend-ts/pages/users/index.ts`
- account: `renderAccount` + RBAC role allowlist + SAFE_MODE gate in `modules/core-system/ui/frontend-ts/pages/account/index.ts`
- developer: `renderDeveloper` + RBAC role allowlist + SAFE_MODE gate in `modules/core-system/ui/frontend-ts/pages/developer/index.ts`
- verification: `renderVerification` + RBAC role allowlist + SAFE_MODE gate in `modules/core-system/ui/frontend-ts/pages/verification/index.ts`

## Routes wired
- RouteId: users, account, developer, verification
- Routes: `#/users`, `#/account`, `#/developer` (alias `#/dev`), `#/verification` (alias `#/verify`)
- Loader: dynamic imports per RouteId in `app/src/moduleLoader.ts`

## Tests added
- users: `modules/core-system/ui/frontend-ts/pages/users/index.test.ts`
- account: `modules/core-system/ui/frontend-ts/pages/account/index.test.ts`
- developer: `modules/core-system/ui/frontend-ts/pages/developer/index.test.ts`
- verification: `modules/core-system/ui/frontend-ts/pages/verification/index.test.ts`

## Gate coverage
- Vitest includes module tests via `app/vite.config.ts`.
