# PAGE_MODULE_RULES

**Référence:** Compléments critiques (Fondation), SSOT.  
**Généré:** 2026-01-24 (sans CODEX)

## 1. Une page = un module

Chaque page est associée à un `page_module_id` (ex. `core.dashboard`, `cp.tenants`). Une page ne doit pas mélanger des responsabilités de plusieurs modules.

## 2. Pas de dépendance page → page

Une page ne doit pas importer ni rendre une autre page. La navigation se fait via le routeur (hash, `navigate`). Les blocs réutilisables doivent vivre dans des modules partagés (sections, _shared, core/ui).

## 3. Lazy-load

Les pages doivent être chargées en lazy via `import()` dynamique (comme dans `moduleLoader` et `CP_PAGES_REGISTRY`), sauf cas explicite (ex. login, dashboard si critique au First Paint).

## 4. Namespace tenant

Les clés de stockage, les appels API et les données doivent être isolés par tenant (namespace `tenant_*` ou équivalent) lorsque l’application est multi-tenant.

## 5. Enregistrement

- **CP:** `CP_PAGES_REGISTRY` (`app/src/pages/cp/registry.ts`). Pour être servi, `renderRoute` doit appeler `renderCpPage` pour les `route_id` correspondants.
- **APP:** `APP_PAGES_REGISTRY` et `__CLIENT_V2_ROUTES__` (`app/src/pages/app/registry.ts`). Aujourd’hui le flux principal utilise `renderRoute` (core-system) pour les 5 routes CLIENT autorisées.

## 6. Rôle du ROUTE_CATALOG

`config/ssot/ROUTE_CATALOG.json` est la source de vérité pour les routes autorisées, `path`, `app_surface`, `page_module_id` et `status`. Les allowlists (`ADMIN_ROUTE_ALLOWLIST`, `__CLIENT_V2_ALLOW`) et `getRouteId` doivent rester alignés avec ce catalogue.
