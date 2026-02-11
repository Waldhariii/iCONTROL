# Structure canonique (2026-02-09)

Cette structure est la base **autorisée** pour iCONTROL. Les chemins hors liste sont considérés non conformes.

## Racine (autorisé)
- `app/`
- `packages/`
- `server/`
- `modules/`
- `runtime/configs/`
- `scripts/`
- `docs/`
- `shared/` (design system)
- `platform-services/` (shell + branding)
- `core-kernel/` (kernel business contract)
- `platform-api/` (contracts)
- `schema-registry/`
- `runtime/`
- `extensions/`

## App (front)
- `app/src/core/`
- `app/src/platform/`
- `app/src/surfaces/cp/`
- `app/src/surfaces/app/`
- `app/src/router.ts`
- `app/src/moduleLoader.ts`
- `app/src/main.ts`
- `app/src/styles/`
- `app/vite.config.ts`
- `app/tsconfig.json`
- `app/package.json`

## Packages
- `packages/studio-bridge/`

## Server
- `server/` (API + DB)

## Config
- `runtime/configs/ssot/` (dont `ROUTE_CATALOG.json`, `design.tokens.json`)

## Scripts
- `scripts/gates/`
- `scripts/generators/`

## Docs
- `governance/docs/RFC_CORE_CHANGES.md`
- `docs/STRUCTURE_CANONIQUE_DEPTH4.txt`

## Notes
- Les dossiers `node_modules/` peuvent exister localement mais ne sont pas canonique.
- Les fichiers temporaires `*.tmp`, `*.backup-*`, `*.pre-*` sont interdits.
