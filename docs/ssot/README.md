# docs/ssot — Documentation SSOT

**Audits (stratégie, ordre d’exécution, rapports)** : voir `docs/audit/README.md` et `scripts/audit/README.md`.

| Fichier | Description |
|---------|-------------|
| `PAGE_INVENTORY.md` | Inventaire des pages (core, cp, app), wired/registry, status. |
| `FUNCTIONAL_CATALOG.md` | MAIN_SYSTEM_MODULES, module-registry, contrats, livrables à compléter. |
| `DESIGN_SYSTEM_SSOT.md` | Tokens, alias --ic-* (coreStyles), composants (core/ui), contrats, états, interdictions. |
| `PAGE_MODULE_RULES.md` | Règles : 1 page = 1 module, pas de dépendance page→page, lazy-load, namespace tenant. |
| `ROUTE_DRIFT_REPORT.md` | Comparaison routes code vs ROUTE_CATALOG ; 0 extra. Généré par `npm run generate:route-drift`. Validé par `npm run gate:route-drift`. |
| `UI_DRIFT_REPORT.md` | Rapport gate UI_DRIFT : couleurs en dur hors `var(--*)` → FAIL (généré par `npm run gate:ui-drift`). |

## Gates SSOT (CI et local)

Le workflow `.github/workflows/ssot-gates.yml` exécute sur PR/push (main, master) :

1. **gate:ui-drift** — couleurs en dur (#hex, rgb, rgba) hors `var(--*)` / tokens → FAIL  
2. **gate:route-catalog** — `config/ssot/ROUTE_CATALOG.json` existe, JSON valide, `routes[]` non vide, `route_id` + `app_surface`  
3. **gate:route-drift** — `docs/ssot/ROUTE_DRIFT_REPORT.md` existe, « Routes extra » = 0 (régénérer : `npm run generate:route-drift`)  
4. **gate:tenant-matrix** — `config/ssot/TENANT_FEATURE_MATRIX.json` existe, `templates` non vide, chaque plan a `enabled_pages[]` et `enabled_capabilities[]`  
5. **gate:design-tokens** — `config/ssot/design.tokens.json` existe, JSON valide, au moins un de `base` / `presets` / `cssVarsMapping` (object)  
6. **gate:capability-status** — `config/ssot/CAPABILITY_STATUS.json` existe, `capabilities[]` non vide, chaque entrée a `id`  
7. **gate:admin-components-registry** — `config/ssot/ADMIN_COMPONENTS_REGISTRY.ts` existe, export `AdminComponentEntry` et `ADMIN_COMPONENTS_REGISTRY = []`  
8. **gate:check-cross-imports** — pas d’imports pages/app ↔ pages/cp  
9. **build:cp** — smoke

**Local :**  
`npm run gate:ssot` (ui-drift, route-catalog, route-drift, tenant-matrix, design-tokens, capability-status, admin-components-registry, check-cross-imports) puis `npm run build:cp` pour reproduire la CI.

### Gates SSOT et périmètre

| Gate | Fichier / périmètre |
|------|---------------------|
| gate:ui-drift | `app/src`, `modules/core-system` — couleurs #hex, rgb, rgba hors `var(--*)` |
| gate:route-catalog | `config/ssot/ROUTE_CATALOG.json` |
| gate:route-drift | `docs/ssot/ROUTE_DRIFT_REPORT.md` — « Routes extra » = 0 (génération : `generate:route-drift`) |
| gate:tenant-matrix | `config/ssot/TENANT_FEATURE_MATRIX.json` |
| gate:design-tokens | `config/ssot/design.tokens.json` |
| gate:capability-status | `config/ssot/CAPABILITY_STATUS.json` |
| gate:admin-components-registry | `config/ssot/ADMIN_COMPONENTS_REGISTRY.ts` |
| gate:check-cross-imports | `app/src/pages/cp` ↔ `app/src/pages/app` |

Fichiers JSON et `design.tokens` : `iCONTROL/config/ssot/`.
