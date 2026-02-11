# runtime/configs/ssot — Source de vérité (SSOT)

Livrables construits **à la main** (sans CODEX), à partir du code (router, allowlists, moduleLoader, registries, mainSystem.data, module-registry, core/ui).

| Fichier | Description |
|---------|-------------|
| `ROUTE_CATALOG.json` | Routes : route_id, path, app_surface, page_module_id, permissions_required, status. Validé par `npm run gate:route-catalog`. |
| `CAPABILITY_STATUS.json` | Statut des capabilities (DONE/PARTIAL/TODO). Validé par `npm run gate:capability-status`. |
| `TENANT_FEATURE_MATRIX.json` | Templates FREE, PRO, ENTERPRISE : enabled_modules, enabled_pages, enabled_capabilities, limits. Validé par `npm run gate:tenant-matrix`. |
| `design.tokens.json` | Tokens de base (MAIN_SYSTEM_THEME) + presets + mapping CSS vars. Validé par `npm run gate:design-tokens`. |
| `ADMIN_COMPONENTS_REGISTRY.ts` | Composants UI autorisés pour la surface Admin (dataTable, badge, toast, etc.). Validé par `npm run gate:admin-components-registry`. |

Voir aussi : `iCONTROL/docs/ssot/` (PAGE_INVENTORY, FUNCTIONAL_CATALOG, DESIGN_SYSTEM_SSOT, PAGE_MODULE_RULES, ROUTE_DRIFT_REPORT).
