# iCONTROL — Runbook Gates UI

## Objectif
Assurer que toute modification UI (non-core) respecte les gates obligatoires avant commit.

## Gates SSOT (CI `.github/workflows/ssot-gates.yml`)

En local, avant push (équivalent CI) :

```sh
npm run gate:ssot        # ui-drift, route-catalog, route-drift, tenant-matrix, design-tokens, capability-status, admin-components-registry, check-cross-imports
npm run build:cp         # smoke
```

- **gate:ui-drift** : couleurs en dur hors `var(--*)` → FAIL ; rapport `docs/ssot/UI_DRIFT_REPORT.md`
- **gate:route-catalog** : `runtime/configs/ssot/ROUTE_CATALOG.json` valide (structure, route_id, app_surface)
- **gate:route-drift** : `docs/ssot/ROUTE_DRIFT_REPORT.md` — « Routes extra » = 0. Régénérer avec `npm run generate:route-drift`.
- **gate:tenant-matrix** : `runtime/configs/ssot/TENANT_FEATURE_MATRIX.json` valide (templates, enabled_pages, enabled_capabilities)
- **gate:design-tokens** : `runtime/configs/ssot/design.tokens.json` valide (base / presets / cssVarsMapping)
- **gate:capability-status** : `runtime/configs/ssot/CAPABILITY_STATUS.json` valide (capabilities[], id)
- **gate:admin-components-registry** : `runtime/configs/ssot/ADMIN_COMPONENTS_REGISTRY.ts` valide (AdminComponentEntry, ADMIN_COMPONENTS_REGISTRY = [])
- **gate:check-cross-imports** : pas d’imports pages/app ↔ pages/cp

## Gates obligatoires (legacy / complément)
```sh
./scripts/audit/audit-no-leaks.zsh
npm run build:app
(cd app && npm run test)
```

## Vérifications manuelles (UI)
1) Démarrer le dev server:
```sh
(cd app && npm run dev -- --port 5176)
```
2) Vérifier routes:
- `#/dashboard`
- `#/users`
- `#/account`
- `#/verification`
- `#/developer`
3) Vérifier SAFE_MODE:
- `STRICT`: sections bloquées visibles avec warning
- `COMPAT`: sections visibles sans actions interdites

## Politique non négociable
- Pas d’inline handlers.
- Actions UI autorisées: `navigate`, `exportCsv`, `noop`.
- Branding uniquement dans `settings_branding`.
