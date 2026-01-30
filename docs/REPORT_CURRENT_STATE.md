# D1 — REPORT_CURRENT_STATE (État actuel factuel)

**Source:** Audit du repo iCONTROL (code + configs + scripts).  
**Date:** 2026-01-27.  
**Périmètre:** `/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL` (racine), `iCONTROL/app` (app principale).

---

## 1. Architecture détectée

| Élément | Détail |
|--------|--------|
| **Apps** | Une app Vite principale (`app/`) servie en deux modes : `VITE_APP_KIND=APP` (port 5176, base `/app/`) et `VITE_APP_KIND=CONTROL_PLANE` (port 5177, base `/cp/`). Pas de packages séparés "admin" vs "client" : un seul bundle par build. |
| **Packages / workspaces** | Monorepo npm : `app`, `langs/frontend-ts`, `modules/*/ui/frontend-ts`, `shared/*`. |
| **Modules métier** | `modules/core-system` (subscription + UI : dashboard, account, users, dossiers, developer, system, toolbox, settings, etc.), `modules/inventory` (manifest seul), `modules/_module-template`. |
| **Services / runtime** | `server/` (runtime-config-server.ts, build.mjs), `platform-services/` (branding, security/auth, ui-shell). `core-kernel/` (10 fichiers TS) : socle pur. |
| **Config** | `config/ssot/` : ROUTE_CATALOG.json, TENANT_FEATURE_MATRIX.json, design.tokens.json, CAPABILITY_STATUS.json, ADMIN_COMPONENTS_REGISTRY.ts. `config/permissions/rbac.json`, `config/safe-mode/`, `config/brand/`, `config/module-registry.json`. |

---

## 2. Gouvernance existante

| Contrat | État | Preuve / Fichiers |
|---------|------|-------------------|
| **SAFE_MODE** | Implémenté (v1) | `app/src/core/runtime/safeMode.ts` : `isSafeMode()` (window.__ICONTROL_SAFE_MODE__ ou localStorage `icontrol.runtime.safeMode.v1`). Bloque écritures dans auditLog, entitlements, etc. Config : `config/safe-mode/*.json`. |
| **RBAC** | Partiel | `config/permissions/rbac.json` (USER, ADMIN, SYSADMIN, DEVELOPER). `app/src/core/governance/rbac/`, `app/src/core/runtime/rbac.ts` (canAccessSettings, canAccessToolbox). Pas d’ABAC ni de policy engine avancé. |
| **Entitlements** | Partiel | `app/src/core/entitlements/` (storage, resolve, gates, requireEntitlement). TENANT_FEATURE_MATRIX (FREE/PRO/ENTERPRISE) défini ; doc TECH_DEBT indique "non branché dans entitlements / guard" (Phase 2.3–2.4). |
| **Write Gateway** | Partiel (pilots) | `app/src/core/write-gateway/` : createWriteGateway, policyHook, auditHook, legacyAdapter. Contrat : tenantId + correlationId obligatoires ; policy + audit + adapter. **WRITE_GATEWAY_CONTRACT.md** : "Non implémenté. Les écritures se font encore via localStorage.setItem, saveEntitlements, etc." |
| **Safe Render** | Minimal | `app/src/safeRender.ts` : wrapper try/catch uniquement. Safe Render "exports/UI filtrés" : présent dans `core/studio/engine/` (html-guards, safe-render.impl, serializer) pour le studio ; pas de moteur d’export PDF/CSV centralisé. |

---

## 3. Multi-tenant

| Élément | État | Preuve |
|--------|------|--------|
| **tenant_id propagation** | Partiel | `getTenantId()` dans `app/src/core/runtime/tenant.ts` (localStorage `icontrol.runtime.tenantId.v1`, défaut "public"). Utilisé dans ~34 fichiers (auditLog, storageNs, write-gateway, entitlements, etc.). Pas de propagation automatique depuis auth/session/hostname. |
| **Data namespaces** | Présent | `app/src/core/runtime/storageNs.ts` : `nsKey(base)` → `icontrol.t.${tenant}.${base}`. Utilisé pour auditLog, entitlements. |
| **Isolation / cross-tenant** | Partiel | Pas de backend par tenant ; tout côté client (localStorage). Aucun test contractuel explicite "cross-tenant query = FAIL". Gates : pas de gate dédié "tenant isolation". |
| **Tests** | Partiels | Tests contractuels audit, subscription, storage namespace, control-plane ; pas de suite dédiée "multi-tenant isolation". |

---

## 4. Catalogue modules / pages

| Élément | État | Détail |
|--------|------|--------|
| **Déclaration** | Manuelle | Routes dans `app/src/router.ts` (getRouteId), ROUTE_CATALOG.json (SSOT déclaratif). CP : CP_PAGES_REGISTRY (`app/src/pages/cp/registry.ts`), APP : APP_PAGES_REGISTRY (`app/src/pages/app/registry.ts`). |
| **Chargement** | Manuelle | `moduleLoader.ts` : chaîne if/else par route_id (users_cp, account_cp, dossiers_cp, developer_cp, …) avec import() dynamique vers `modules/core-system/ui/frontend-ts/pages/*`. Pas d’auto-discovery. |
| **Menus / nav** | Codés en dur | Sidebar / nav dérivés du router et des registries ; pas de fichier "menu" SSOT. |
| **Permissions / entitlements par page** | ROUTE_CATALOG | `permissions_required`, `tenant_visibility` dans ROUTE_CATALOG ; canAccessSettings, canAccessToolbox utilisés dans le router. TENANT_FEATURE_MATRIX (enabled_pages par plan) non branché dans le guard de navigation. |
| **Manifestes module** | Partiel | `modules/core-system/manifest/manifest.json` (id, routes, permissions, storageScopes, flags). `_module-template`, `inventory` ont un manifest. Pas de convention "une page = un manifest" ni de scan au build. |

---

## 5. Design system

| Élément | État | Fichiers |
|--------|------|----------|
| **Tokens** | Centralisés | `config/ssot/design.tokens.json` (base, cp, presets). `app/src/core/theme/` (themeTokens, loadPreset, applyThemeCssVars, presets). |
| **Thèmes** | Admin vs Client | Presets cp-dashboard-charcoal, app-foundation-slate (dark/light). Pas de cloisonnement strict "un thème par surface" dans le code. |
| **Composants** | Présents | `app/src/core/ui/` (catalog, registry, themeManager, dataTable, modal, etc.). core-system utilise _shared (uiBlocks, themeCssVars, sections). |
| **Stabilité visuelle** | Partielle | Scripts audit UI : audit-ui-contrast, audit-ui-no-hardcoded-colors, audit-ui-theme-cssvars, audit-ui-cssvars-rollout. Gates : gate:ui-drift, gate:design-tokens. _AUDIT_STYLE_SSOT.md signale des styles legacy. |
| **CSS sauvage** | Risque | Lint / audits ciblent couleurs en dur et TOK.* ; pas d’interdiction globale "zéro CSS ad hoc" dans les modules. |

---

## 6. Pipelines docs / OCR / IA

| Élément | État | Fichiers / Config |
|--------|------|--------------------|
| **Docs / DMS** | Absent | CAPABILITY_STATUS : DOCS_OCR TODO, route #/docs absente. Aucun module "documents" ou "DMS" implémenté. |
| **OCR** | Absent | module-registry : ocr complementary, désactivé. Aucun pipeline OCR. |
| **IA** | Absent | Aucun pipeline IA (extraction, classification, auto-entry). Pas de traçabilité modèle. |
| **Points d’intégration** | Préparés | Module-registry et CAPABILITY_STATUS prévoient documents, ocr, finance, etc. ; pas de code. |

---

## 7. Facturation / Compta / Jobs / Calendrier / CRM

| Capacité | État | Détail |
|----------|------|--------|
| **Facturation** | Mention uniquement | subscription.ts (texte "Plans et facturation", "Prochaine facture"). Aucun module facturation/invoicing. |
| **Comptabilité** | Absent | Aucun module compta (ledger, écritures, rapprochement). |
| **Jobs / Work Orders** | Absent | CAPABILITY_STATUS : jobs TODO. Aucune page. |
| **Calendrier** | Absent | CAPABILITY_STATUS : calendar TODO. module-registry calendar complementary. |
| **CRM** | Absent | Pas de pipeline leads/opportunités, contacts, organisations. "clients" PARTIAL (module-registry, pas de page). |
| **Dossiers** | Présent | Module dossiers branché (#/dossiers), core-system UI (list, detail, filters, bulk, storage, safe-mode). |

---

## 8. Tests / Gates / CI

| Élément | État | Détail |
|--------|------|--------|
| **Tests** | Vitest | `app/src/__tests__/` (~100 fichiers .ts). Contract tests : audit, subscription, control-plane, storage, cache, write-gateway, studio. |
| **Gates** | Nombreux | package.json : gate:ssot, gate:route-catalog, gate:route-drift, gate:tenant-matrix, gate:design-tokens, gate:capability-status, gate:admin-components-registry, gate:check-cross-imports, gate:write-gateway-coverage, gate:write-surface-map, gate:routing:ssot, gate:rg-n-safety. |
| **CI** | GitHub Actions | ssot-gates.yml, ci-test.yml, cp-proofs.yml, server-ssot.yml, releaseops-gate.yml, ssot-verify.yml. |
| **Pre-commit / pre-push** | .githooks | pre-commit (audit-no-leaks, gates), pre-push (gate:ssot). |
| **Couverture** | Non mesurée ici | Pas de rapport coverage dans l’audit. |
| **Points manquants** | Doc | Pas de gate "tenant isolation" explicite ; pas de GATES_SELF_HEAL (reliability) ; Write Gateway non couvert à 100% (écritures encore directes). |

---

## 9. Dette technique priorisée (sécurité / isolement / perf en premier)

| Priorité | Dette | Fichiers / Actions |
|----------|-------|--------------------|
| **P1** | Write Gateway non unique | Écritures directes localStorage/saveEntitlements. Centraliser dans write-gateway, snapshot/rollback pour cibles critiques (WRITE_GATEWAY_CONTRACT.md). |
| **P2** | TENANT_FEATURE_MATRIX non branché | Entitlements / guard de navigation ne filtrent pas les pages par plan. Brancher dans resolve + router/moduleLoader. |
| **P2** | Pas de gate "tenant isolation" | Ajouter tests contractuels + gate : aucune requête/écriture sans tenant_id, pas de cross-tenant. |
| **P2** | DOCS_OCR / route #/docs | Ajouter route et module documents si cible DMS. |
| **P2** | PAGE→PAGE / cross-imports | Gate check-cross-imports présent ; renforcer PAGE_BOUNDARY_LINT. |
| **P3** | renderRoute imports statiques | Plusieurs pages CP en lazy ; quelques chemins encore non lazy. |
| **P3** | Safe Render "exports" | Pas de moteur d’export PDF/CSV centralisé avec filtre par autorisations. |
| **P3** | Styles legacy | Réduire couleurs en dur, migrer vers tokens (audits UI existants). |

---

## 10. Conventions observées

- **ERR_* / WARN_*** : Utilisés dans router, moduleLoader, dashboard, tenants, localAuth, studio (execute), _shared/sections. Pas de taxonomie centralisée (SECURITY/DATA/PERF/UX).  
- **Plan visuel** : Documenté dans docs (STYLE_INVENTORY, DESIGN_SYSTEM_SSOT) ; arborescence UI et tokens figés dans config/ssot et core/theme.  
- **Kernel / governance** : core-kernel isolé ; app/core contient runtime, write-gateway, entitlements, studio (blueprints, safe-render).  

---

*Rapport factuel ; pas de modification du code. Alimente D2 (GAP_MATRIX) et D3 (EXECUTION_ROADMAP_AZ).*
