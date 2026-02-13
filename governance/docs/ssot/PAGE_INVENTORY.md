# PAGE_INVENTORY — inventaire des pages

**Source:** `app/src/pages/*`, `modules/core-system/ui/frontend-ts/pages/*`, `app/src/moduleLoader.ts`, `app/src/pages/cp/registry.ts`, `app/src/pages/app/registry.ts`  
**Généré:** 2026-01-24 (sans CODEX)

## Légende

| Champ | Description |
|-------|-------------|
| **Fichier** | Chemin du fichier ou du dossier page |
| **Surface** | CP = Control Plane, APP = Client |
| **page_module_id** | Identifiant du module (core.* = moduleLoader/core-system, cp.* = CP_PAGES_REGISTRY, app.* = APP_PAGES_REGISTRY) |
| **Wired** | Oui si servi par le flux main→renderShell→renderRoute (moduleLoader) ou renderCpPage/renderAppPage |
| **Status** | ACTIVE (wired), EXPERIMENTAL (registry seul), HIDDEN (dev/debug) |

---

## 1. Pages servies par moduleLoader (core-system) — Wired

| Fichier | Surface | page_module_id | RouteId | Status |
|---------|---------|----------------|---------|--------|
| `modules/core-system/.../pages/login.ts` | CP, APP | core.login | login | ACTIVE |
| `modules/core-system/.../pages/dashboard.ts` | CP, APP | core.dashboard | dashboard | ACTIVE |
| `modules/core-system/.../pages/settings/index.ts` | CP | core.settings | settings | ACTIVE |
| `modules/core-system/.../pages/account/index.ts` | CP, APP | core.account | account | ACTIVE |
| `modules/core-system/.../pages/users/index.ts` | CP, APP | core.users | users | ACTIVE |
| `modules/core-system/.../pages/system/index.ts` | CP, APP | core.system | system | ACTIVE |
| `modules/core-system/.../pages/logs/index.ts` | CP | core.logs | logs | ACTIVE |
| `modules/core-system/.../pages/developer/index.tsx` | CP | core.developer | developer | ACTIVE |
| `modules/core-system/.../pages/access-denied/index.tsx` | CP, APP | core.access_denied | access_denied | ACTIVE |
| `modules/core-system/.../pages/verification/index.ts` | CP | core.verification | verification | ACTIVE |
| `modules/core-system/.../pages/toolbox.ts` | CP | core.toolbox | toolbox | ACTIVE |

---

## 2. Page runtime-smoke (hors hash, ?runtime=1)

| Fichier | Surface | page_module_id | RouteId | Status |
|---------|---------|----------------|---------|--------|
| `app/src/pages/runtime-smoke.ts` | CP | core.runtime_smoke | runtime_smoke | HIDDEN |

---

## 3. Pages CP_PAGES_REGISTRY (cp.*) — non branchées dans renderRoute

| Fichier | Surface | page_module_id | RouteId | Status |
|---------|---------|----------------|---------|--------|
| `app/src/pages/cp/login.ts` | CP | cp.login | login | EXPERIMENTAL (doublon core) |
| `app/src/pages/cp/dashboard.ts` | CP | cp.dashboard | dashboard | EXPERIMENTAL (doublon core) |
| `app/src/pages/cp/system.ts` | CP | cp.system | system | EXPERIMENTAL (doublon core) |
| `app/src/pages/cp/users.ts` | CP | cp.users | users | EXPERIMENTAL (doublon core) |
| `app/src/pages/cp/subscription.ts` | CP | cp.subscription | subscription | EXPERIMENTAL |
| `app/src/pages/cp/tenants.ts` | CP | cp.tenants | tenants | EXPERIMENTAL |
| `app/src/pages/cp/entitlements.ts` | CP | cp.entitlements | entitlements | EXPERIMENTAL |
| `app/src/pages/cp/pages.ts` | CP | cp.pages | pages | EXPERIMENTAL |
| `app/src/pages/cp/feature-flags.ts` | CP | cp.feature-flags | feature-flags | EXPERIMENTAL |
| `app/src/pages/cp/publish.ts` | CP | cp.publish | publish | EXPERIMENTAL |
| `app/src/pages/cp/login-theme.ts` | CP | cp.login-theme | login-theme | EXPERIMENTAL |
| `app/src/pages/cp/audit.ts` | CP | cp.audit | audit | EXPERIMENTAL |
| `app/src/pages/cp/integrations.ts` | CP | cp.integrations | integrations | EXPERIMENTAL |
| `app/src/pages/cp/access-denied.ts` | CP | cp.access_denied | access_denied | EXPERIMENTAL (doublon core) |
| `app/src/pages/cp/blocked.ts` | CP | cp.blocked | blocked | EXPERIMENTAL |
| `app/src/pages/cp/notfound.ts` | CP | cp.notfound | notfound | EXPERIMENTAL |
| `app/src/pages/cp/ui-catalog.ts` | CP | cp.ui_catalog | ui_catalog | HIDDEN |

---

## 4. Pages APP_PAGES_REGISTRY (app.*) — Client désactivé / fallback

| Fichier | Surface | page_module_id | RouteId | Status |
|---------|---------|----------------|---------|--------|
| `app/src/pages/app/client-disabled.ts` | APP | app.client_disabled | client_disabled | ACTIVE |
| `app/src/pages/app/client-access-denied.ts` | APP | app.access_denied | access_denied | ACTIVE |
| `app/src/pages/app/client-catalog.ts` | APP | app.client_catalog | client_catalog | HIDDEN |

---

## 5. __CLIENT_V2_ROUTES__ (composants) — non branchés dans renderRoute

| Fichier | Surface | path | Status |
|---------|---------|------|--------|
| `app/src/pages/app/client-dashboard.tsx` | APP | /dashboard | Non branché (renderRoute utilise core.dashboard) |
| `app/src/pages/app/client-account.tsx` | APP | /account | Non branché |
| `app/src/pages/app/client-settings.tsx` | APP | /settings | Non branché |
| `app/src/pages/app/client-users.tsx` | APP | /users | Non branché |
| `app/src/pages/app/client-system.tsx` | APP | /system | Non branché |

---

## 6. Autres (core-system) non exposés comme routes

| Fichier | Notes |
|---------|-------|
| `modules/core-system/.../pages/blocked/index.ts` | Existe; moduleLoader ne le route pas (utilise cp.blocked si renderCpPage branché) |
| `modules/core-system/.../pages/activation/index.tsx` | Référencé dans moduleLoader (hash #/activation) mais variable `hash`/`mount` incorrecte dans le code actuel |

---

## Synthèse

- **Wired (moduleLoader):** 14 routes core.* + runtime_smoke.
- **CP_PAGES_REGISTRY:** 17 entrées; aucune n’est appelée par `renderRoute` (il faudrait brancher `renderCpPage` selon `route_id` pour tenants, audit, login-theme, blocked, etc.).
- **APP_PAGES_REGISTRY:** 3 entrées (client_disabled, access_denied, client_catalog); `renderAppPage` n’est pas appelée par le flux principal (redirect/guard gère disabled).
- **__CLIENT_V2_ROUTES__:** 5 composants Client* ; le flux utilise `renderRoute` → core-system, pas ces composants.
