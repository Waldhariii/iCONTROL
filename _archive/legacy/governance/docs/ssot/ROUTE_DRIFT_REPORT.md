# ROUTE_DRIFT_REPORT

**Comparaison:** routes effectivement servies / connues dans le code vs `runtime/configs/ssot/ROUTE_CATALOG.json`.
**Généré:** 2026-01-30T00:37:20Z

## Méthode

- **Code:** `router.getRouteId`, `getRouteIdFromHash`, `CP_PAGES_REGISTRY`, `APP_PAGES_REGISTRY`, `__CLIENT_V2_ROUTES__`, `moduleLoader.renderRoute`.
- **Catalogue:** `runtime/configs/ssot/ROUTE_CATALOG.json`.

## Résultat

| Métrique | Valeur |
|----------|--------|
| **Routes dans ROUTE_CATALOG** | 35 entrées (plusieurs (route_id, app_surface) pour même path) |
| **Routes extra (dans le code, absentes du catalogue)** | 0 |
| **Routes manquantes (dans le catalogue, inconnues du code)** | 1 |

### Routes manquantes (dans le catalogue, inconnues du code)

```
todo___dans | CLIENT
```

## Recommandations

1. **Routes extra:** les ajouter à `ROUTE_CATALOG.json` avec `app_surface` et `status` appropriés, ou les retirer du code.
2. **Routes manquantes:** les retirer du catalogue ou les implémenter dans le code.
