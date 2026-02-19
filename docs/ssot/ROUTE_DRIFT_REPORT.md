# ROUTE_DRIFT_REPORT

**Comparaison:** routes effectivement servies / connues dans le code vs `runtime/configs/ssot/ROUTE_CATALOG.json`.
**Généré:** 2026-02-18T19:47:52Z

## Méthode

- **Code:** `router.getRouteId` (dérivé catalogue), `CP_PAGE_REGISTRY` (manifest), `ROUTE_CATALOG.json`.
- **Catalogue:** `runtime/configs/ssot/ROUTE_CATALOG.json`.

## Résultat

| Métrique | Valeur |
|----------|--------|
| **Routes dans ROUTE_CATALOG** | 50 entrées (plusieurs (route_id, app_surface) pour même path) |
| **Routes extra (dans le code, absentes du catalogue)** | 0 |
| **Routes manquantes (dans le catalogue, inconnues du code)** | 0 |

Le catalogue est aligné avec le code (getRouteIdFromHash, registries, moduleLoader).
