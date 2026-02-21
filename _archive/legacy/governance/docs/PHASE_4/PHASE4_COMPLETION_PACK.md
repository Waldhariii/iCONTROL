# PHASE 4 — Completion Pack (SSOT Routes + Manifests)

## Outcomes
- SSOT route catalog V1: `runtime/configs/ssot/ROUTE_CATALOG.json`
- Consumption facade: `app/src/core/routes/routeCatalog.ts`
- Gates:
  - `gate:route-catalog` — validates shape + non-empty routes
  - `gate:module-manifests.v1` — validates all `modules/**/manifest/module.json` (schema-lite)
  - `gate:entitlements-scatter-warn` — warn-only evidence of scattered tier/plan checks

## Governance expectations
- Add new public routes only via SSOT update + contract test.
- Add/modify modules via manifest update; gate will enforce minimal shape.
- Any scattered tier/plan checks should be refactored behind the entitlements resolver strategy (ADR-005).

## Validation commands
- `npm run -s verify:prod:fast`
- `npm test`
- `npm run -s gate:tag-integrity`
- `npm run -s gate:preflight:prod`
