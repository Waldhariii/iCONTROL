# ROUTE_DRIFT_REPORT

**Comparaison:** routes effectivement servies / connues dans le code vs `config/ssot/ROUTE_CATALOG.json`.
**Généré:** 2026-01-24T19:26:42Z

## Méthode

- **Code:** `router.getRouteId`, `getRouteIdFromHash`, `CP_PAGES_REGISTRY`, `APP_PAGES_REGISTRY`, `__CLIENT_V2_ROUTES__`, `moduleLoader.renderRoute`.
- **Catalogue:** `config/ssot/ROUTE_CATALOG.json`.

## Résultat

| Métrique | Valeur |
|----------|--------|
| **Routes dans ROUTE_CATALOG** | 39 entrées (plusieurs (route_id, app_surface) pour même path) |
| **Routes extra (dans le code, absentes du catalogue)** | 0 |
| **Routes manquantes (dans le catalogue, inconnues du code)** | 0 |

Le catalogue est aligné avec le code (getRouteIdFromHash, registries, moduleLoader).
