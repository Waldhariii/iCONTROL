# Rapport système complet — Chemins, routes, informations primordiales et recommandations

**Date:** 2026-01-27.  
**Référence:** PATHS_CANONICAL, ROUTE_CATALOG, TENANT_FEATURE_MATRIX, D1–D5, roadmap, backlog, vision optimale.

---

# PARTIE 1 — CHEMINS CANONIQUES (NE PAS DEVINER)

## 1.1 Racine du dépôt

- **Racine monorepo :** `iCONTROL/` (ou chemin absolu du repo).
- **App principale :** `iCONTROL/app/`.
- **Racines de code :** `app/src`, `modules`, `platform-services`, `server` (cf. governance/docs/ARCH/PATHS_CANONICAL.md).

## 1.2 Router et routing (SSOT)

| Rôle | Chemin |
|------|--------|
| Router actif (SSOT) | `app/src/router.ts` |
| Router déprécié (tests uniquement) | `app/src/runtime/router.ts` |
| Module loader | `app/src/moduleLoader.ts` |
| Registry CP | `app/src/pages/cp/registry.ts` |
| Registry APP | `app/src/pages/app/registry.ts` |
| Catalogue routes (SSOT) | `runtime/configs/ssot/ROUTE_CATALOG.json` |
| Audit non-régression chemins | `scripts/audit/audit-chemins-non-regression.sh` |
| Gate routing SSOT | `scripts/gates/gate-routing-ssot.mjs` |

## 1.3 Config SSOT

| Fichier | Chemin |
|---------|--------|
| ROUTE_CATALOG | `runtime/configs/ssot/ROUTE_CATALOG.json` |
| TENANT_FEATURE_MATRIX | `runtime/configs/ssot/TENANT_FEATURE_MATRIX.json` |
| design.tokens | `runtime/configs/ssot/design.tokens.json` |
| CAPABILITY_STATUS | `runtime/configs/ssot/CAPABILITY_STATUS.json` |
| ADMIN_COMPONENTS_REGISTRY | `runtime/configs/ssot/ADMIN_COMPONENTS_REGISTRY.ts` |
| README SSOT | `runtime/configs/ssot/governance/docs/STANDARDS/README.md` |

## 1.4 Config gouvernance et permissions

| Fichier | Chemin |
|---------|--------|
| RBAC | `runtime/configs/permissions/rbac.json` |
| Safe-mode (exemple, schéma) | `runtime/configs/safe-mode/safe-mode.example.json`, `runtime/configs/safe-mode.schema.json`, `runtime/configs/safe-mode.enforcement.example.json`, `runtime/configs/safe-mode.enforcement.schema.json` |
| Brand | `runtime/configs/brand/brand.default.json`, `runtime/configs/brand.override.local.json`, `runtime/configs/brand.schema.json` |
| Branding | `runtime/configs/branding/branding.json` |
| Module registry | `runtime/configs/module-registry.json` |

## 1.5 Feature flags et policies

| Fichier | Chemin |
|---------|--------|
| Feature flags (SSOT) | `app/src/policies/feature_flags.default.json` |
| Policies (audit, control_plane, trace, version, safe_mode, etc.) | `app/src/policies/*.ts`, `app/src/policies/*.json` |

## 1.6 Write Gateway et pilots Phase 1

| Rôle | Chemin |
|------|--------|
| Write Gateway | `app/src/core/write-gateway/writeGateway.ts`, `app/src/core/write-gateway/index.ts` |
| Policy hook | `app/src/core/write-gateway/policyHook.ts` |
| Audit hook | `app/src/core/write-gateway/auditHook.ts` |
| Contrats | `app/src/core/write-gateway/contracts.ts` |
| Legacy adapter | `app/src/core/write-gateway/adapters/legacyAdapter.ts` |
| Audit log | `app/src/core/audit/auditLog.ts` |
| Entitlements storage | `app/src/core/entitlements/storage.ts` |
| Tenant | `app/src/core/runtime/tenant.ts` |
| SafeMode | `app/src/core/runtime/safeMode.ts` |
| Runtime config | `app/src/core/runtime/runtimeConfig.ts` |
| Theme | `app/src/core/ui/themeManager.ts` |
| Login theme override | `app/src/pages/cp/ui/loginTheme/loginTheme.override.ts` |
| Users (views) | `app/src/pages/cp/views/users.ts` |
| Brand service | `platform-services/branding/brandService.ts` |
| Local auth | `platform-services/security/auth/localAuth.ts` |
| UI catalog | `app/src/core/ui/catalog/index.ts` |
| CP storage | `app/src/core/control-plane/storage.ts` |
| FileSubscriptionStore | `modules/core-system/subscription/FileSubscriptionStore.node.ts` |

## 1.7 Gates (scripts)

| Gate | Chemin |
|------|--------|
| SSOT paths | `scripts/gates/gate-ssot-paths.mjs` |
| Write surface map | `scripts/gates/gate-write-surface-map.mjs` |
| Write gateway coverage | `scripts/gates/gate-write-gateway-coverage.mjs` |
| Route catalog | `scripts/gates/check-route-catalog.mjs` |
| Route drift | `scripts/gates/check-route-drift.mjs` |
| Generate route drift | `scripts/gates/generate-route-drift-report.mjs` |
| Tenant feature matrix | `scripts/gates/check-tenant-feature-matrix.mjs` |
| Design tokens | `scripts/gates/check-design-tokens.mjs` |
| Generate design tokens CSS | `scripts/gates/generate-design-tokens-css.mjs` |
| Capability status | `scripts/gates/check-capability-status.mjs` |
| Admin components registry | `scripts/gates/check-admin-components-registry.mjs` |
| CP/APP cross-imports | `scripts/gates/check-cp-app-cross-imports.mjs` |
| Gates sanity | `scripts/gates/gate-gates-sanity.mjs` |
| RG-n-safety | `scripts/gates/gate-rg-n-safety.mjs` |
| RG-n-safety triage | `scripts/gates/gate-rg-n-safety-triage.mjs` |
| Write surface triage | `scripts/gates/gate-write-surface-triage.mjs` |
| UI drift | `scripts/gates/run_ui_drift_gate.sh`, `scripts/gates/gate-ui-inline-drift.sh` |
| UI component registry | `scripts/gates/gate-ui-component-registry.mjs` |
| UI contracts | `scripts/gates/gate-ui-contracts.mjs` |
| PAGE_BOUNDARY_LINT_RULES | `scripts/gates/PAGE_BOUNDARY_LINT_RULES.json` |

## 1.8 Audits (scripts)

| Script | Chemin |
|--------|--------|
| No-leaks | `scripts/audit/audit-no-leaks.zsh` |
| Chemins non-régression | `scripts/audit/audit-chemins-non-regression.sh` |
| Release candidate | `scripts/audit/audit-release-candidate.zsh` |
| UI contrast | `scripts/audit/audit-ui-contrast.zsh` |
| UI no hardcoded colors | `scripts/audit/audit-ui-no-hardcoded-colors.zsh` |
| UI theme cssvars | `scripts/audit/audit-ui-theme-cssvars.zsh` |
| UI cssvars rollout | `scripts/audit/audit-ui-cssvars-rollout.zsh` |
| UI cssvars backlog shared | `scripts/audit/audit-ui-cssvars-backlog-shared.zsh` |
| Subscription no UI coupling | `scripts/audit/audit-subscription-no-ui-coupling.zsh` |
| No node builtins (app) | `scripts/audit/audit-no-node-builtins-in-app.zsh` |
| No node builtins (client) | `scripts/audit/audit-no-node-builtins-in-client-surface.zsh` |
| System complete | `scripts/audit/audit-system-complete.mjs` |
| README audit | `scripts/audit/governance/docs/STANDARDS/README.md` |

## 1.9 Hooks et CI

| Élément | Chemin |
|---------|--------|
| Pre-commit | `.githooks/pre-commit` |
| Pre-push | `.githooks/pre-push` |
| Pre-commit orchestrator | `.githooks/pre-commit-orchestrator` |
| Post-commit | `.githooks/post-commit` |
| Workflows CI | `.github/workflows/ssot-gates.yml`, `ci-test.yml`, `cp-proofs.yml`, `server-ssot.yml`, `releaseops-gate.yml`, `ssot-verify.yml` |

## 1.10 Rapports générés (ne pas éditer à la main)

| Rapport | Chemin |
|---------|--------|
| Surface map | `docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_surface_map_report.md` |
| Gateway coverage | `docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_gateway_coverage_report.md` |
| Audit non-régression chemins | `docs/audit/reports/AUDIT_NON_REGRESSION_CHEMINS.md` |
| Route drift | `docs/ssot/ROUTE_DRIFT_REPORT.md` (généré par `generate:route-drift`) |
| UI drift | `docs/ssot/UI_DRIFT_REPORT.md` |

## 1.11 Docs de référence

| Doc | Chemin |
|-----|--------|
| PATHS_CANONICAL (racine) | `governance/docs/ARCH/PATHS_CANONICAL.md` |
| PATHS_CANONICAL (ssot) | `docs/ssot/governance/docs/ARCH/PATHS_CANONICAL.md` |
| REPORT_CURRENT_STATE | `docs/REPORT_CURRENT_STATE.md` |
| GAP_MATRIX | `docs/GAP_MATRIX.md` |
| EXECUTION_ROADMAP_AZ | `docs/EXECUTION_ROADMAP_AZ.md` |
| AUTO_ADAPT_SYSTEM_SPEC | `docs/AUTO_ADAPT_SYSTEM_SPEC.md` |
| BACKLOG_READY | `docs/BACKLOG_READY.md` |
| ACTIONS_RESTANTES_ET_PROGRESSION | `docs/ACTIONS_RESTANTES_ET_PROGRESSION.md` |
| RELIABILITY_SPEC | `docs/RELIABILITY_SPEC.md` |
| RELIABILITY_RUNBOOKS | `docs/RELIABILITY_RUNBOOKS.md` |
| REPAIR_JOB_CATALOG | `docs/REPAIR_JOB_CATALOG.md` |
| SLO_SLA_METRICS | `docs/SLO_SLA_METRICS.md` |
| WRITE_GATEWAY_CONTRACT | `governance/docs/WRITE_GATEWAY_CONTRACT.md` |
| RUNBOOK_ROLLBACK | `governance/docs/RELEASES/RUNBOOK_ROLLBACK.md` |

## 1.12 Modules et manifests

| Élément | Chemin |
|---------|--------|
| Core-system manifest | `modules/core-system/manifest/manifest.json` |
| Module template | `modules/_module-template/manifest/manifest.json` |
| Inventory manifest | `modules/inventory/manifest/manifest.json` |
| Core-system UI (pages) | `modules/core-system/ui/frontend-ts/pages/` (account, dashboard, developer, dossiers, login, system, toolbox, users, settings, verification, activation, blocked, access-denied) |

## 1.13 Entrées applicatives

| Élément | Chemin |
|---------|--------|
| Index HTML (app) | `app/index.html` |
| Main (app) | `app/src/main.ts` |
| Vitest setup | `app/vitest.setup.ts`, `app/src/vitest.setup.ts` |
| Vite config | `app/vite.config.ts` |
| TSConfig | `app/tsconfig.json` |

## 1.14 Server

| Élément | Chemin |
|---------|--------|
| Runtime config server | `server/runtime-config-server.ts`, `server/runtime-config-server.js` |
| Build | `server/build.mjs` |
| Log | `server/log.mjs`, `server/log.ts` |
| Smoke | `server/smoke-runtime-config.mjs` |
| SSOT invariants test | `server/ssot-invariants.test.mjs` |

---

# PARTIE 2 — TOUTES LES ROUTES (route_id, path, page_module_id)

**Source :** `runtime/configs/ssot/ROUTE_CATALOG.json`.  
Règle : tous les `route_id` sont uniques avec suffixe `_cp` (Control Plane) ou `_app` (Client). Aucune route partagée entre APP et CP.

## 2.1 Routes Control Plane (CP)

| route_id | path (hash) | page_module_id | permissions_required | status |
|----------|-------------|----------------|----------------------|--------|
| login_cp | #/login | cp.login | [] | ACTIVE |
| dashboard_cp | #/dashboard | cp.dashboard | [] | ACTIVE |
| account_cp | #/account | cp.account | [] | ACTIVE |
| login_theme_cp | #/login-theme | cp.login_theme | [] | ACTIVE |
| settings_cp | #/settings | cp.settings | [canAccessSettings] | ACTIVE |
| settings_branding_cp | #/settings/branding | cp.settings_branding | [canAccessSettings] | ACTIVE |
| users_cp | #/users | cp.users | [] | ACTIVE |
| system_cp | #/system | cp.system | [] | ACTIVE |
| developer_cp | #/developer | core.developer | [] | ACTIVE |
| developer_entitlements_cp | #/developer/entitlements | core.developer_entitlements | [] | ACTIVE |
| access_denied_cp | #/access-denied | cp.access_denied | [] | ACTIVE |
| verification_cp | #/verification | core.verification | [] | ACTIVE |
| blocked_cp | #/blocked | cp.blocked | [] | EXPERIMENTAL |
| toolbox_cp | #/toolbox | core.toolbox | [canAccessToolbox] | ACTIVE |
| logs_cp | #/logs | core.logs | [] | ACTIVE |
| dossiers_cp | #/dossiers | core.dossiers | [] | ACTIVE |
| runtime_smoke_cp | #/runtime-smoke | core.runtime_smoke | [] | HIDDEN |
| tenants_cp | #/tenants | cp.tenants | [] | EXPERIMENTAL |
| entitlements_cp | #/entitlements | cp.entitlements | [] | EXPERIMENTAL |
| pages_cp | #/pages | cp.pages | [] | EXPERIMENTAL |
| feature-flags_cp | #/feature-flags | cp.feature-flags | [] | EXPERIMENTAL |
| publish_cp | #/publish | cp.publish | [] | EXPERIMENTAL |
| audit_cp | #/audit | cp.audit | [] | EXPERIMENTAL |
| subscription_cp | #/subscription | cp.subscription | [] | EXPERIMENTAL |
| integrations_cp | #/integrations | cp.integrations | [] | EXPERIMENTAL |
| ui_catalog_cp | #/__ui-catalog | cp.ui_catalog | [] | HIDDEN |
| notfound_cp | (fallback) | cp.notfound | [] | ACTIVE |

## 2.2 Routes App Client (APP)

| route_id | path (hash) | page_module_id | status |
|----------|-------------|----------------|--------|
| home_app | #/home-app | app.home_app | ACTIVE |
| client_disabled_app | #/client-disabled | app.client_disabled | ACTIVE |
| client_catalog_app | #/__ui-catalog-client | app.client_catalog | HIDDEN |
| pages_inventory_app | #/pages-inventory | app.pages_inventory | EXPERIMENTAL |
| access_denied_app | #/access-denied | app.access_denied | ACTIVE |
| notfound_app | (fallback) | app.notfound | ACTIVE |

## 2.3 URLs de développement (base + port)

| Surface | Base path | Port | URL typique |
|---------|-----------|------|-------------|
| APP | /app/ | 5176 | http://127.0.0.1:5176/app/#/home-app |
| CP | /cp/ | 5177 | http://127.0.0.1:5177/cp/#/dashboard |
| Build APP | /app/ | — | dist/app, base /app/ |
| Build CP | /cp/ | — | dist/cp, base /cp/ |

Variables d’environnement : `VITE_APP_KIND=APP` ou `VITE_APP_KIND=CONTROL_PLANE`.

---

# PARTIE 3 — INFORMATIONS PRIMORDIALES

## 3.1 Clés localStorage (runtime)

| Clé | Usage |
|-----|--------|
| icontrol.runtime.tenantId.v1 | Tenant courant (défaut "public") |
| icontrol.runtime.safeMode.v1 | SAFE_MODE (1/0 ou true/false) |
| nsKey(base) → icontrol.t.${tenant}.${base} | Namespace stockage (ex. auditLog.v1, entitlements) |

## 3.2 Conventions de nommage

- **Routes :** suffixe `_cp` (Control Plane) ou `_app` (Client). Aucune route sans suffixe.
- **Codes erreur / avertissement :** préfixes `ERR_*`, `WARN_*` (ex. ERR_WRITE_CMD_TENANT_REQUIRED, WARN_ROUTE_IMPORT_FAILED).
- **Manifests module :** `modules/<module-id>/manifest/manifest.json`.
- **Plans tenant :** FREE, PRO, ENTERPRISE (TENANT_FEATURE_MATRIX).

## 3.3 Rôles RBAC (runtime/configs/permissions/rbac.json)

- USER, ADMIN, SYSADMIN, DEVELOPER.
- Règles : DEVELOPER (*), SYSADMIN (read:*, write:admin, write:user, toggle:safe_mode, view:selfcheck, view:developer), ADMIN (read:*, write:user), USER (read:dashboard, read:account, read:own_data).

## 3.4 Plans et enabled_pages (extrait TENANT_FEATURE_MATRIX)

- **FREE :** enabled_pages = login_cp, dashboard_cp, account_cp, home_app, pages_inventory_app, client_catalog_app, client_disabled_app, access_denied_app, notfound_app, access_denied_cp, blocked_cp, notfound_cp. enabled_modules = core-system.
- **PRO :** en plus settings_cp, users_cp, system_cp, logs_cp, dossiers_cp, developer_cp, developer_entitlements_cp, verification_cp, tenants_cp, audit_cp, login_theme_cp. enabled_modules = core-system, dossiers.
- **ENTERPRISE :** en plus settings_branding_cp, entitlements_cp, pages_cp, feature-flags_cp, publish_cp, subscription_cp, integrations_cp. enabled_modules = core-system, dossiers, clients, integrations-hub.

## 3.5 Règles à ne pas transgresser

- Ne jamais supposer la racine du repo : utiliser PATHS_CANONICAL ou `scripts/ssot/paths.mjs`.
- Ne pas faire d’écriture directe (localStorage, config) hors Write Gateway une fois la Phase 1.3 livrée.
- Ne pas ajouter de route sans l’enregistrer dans ROUTE_CATALOG et dans le moduleLoader (ou le registry généré).
- Ne pas importer `app/src/runtime/router.ts` en dehors des tests (router déprécié).
- Ne pas mélanger imports pages/cp ↔ pages/app (gate check-cp-app-cross-imports).

---

# PARTIE 4 — RECOMMANDATIONS ET CONSEILS POUR FAIRE LE SYSTÈME DU RAPPORT

## 4.1 Ordre d’exécution recommandé (résumé)

1. **Phase 0** — Valider invariants (npm test, gate:ssot) ; rédiger le document SSOT “module registry + état des pages”.
2. **Phase 1 (priorité sécurité/isolation)**  
   - Créer le gate **tenant isolation** (`app/src/__tests__/tenant-isolation.contract.test.ts`) et l’ajouter en CI.  
   - Brancher **TENANT_FEATURE_MATRIX** dans `app/src/core/entitlements/resolve.ts` et dans le guard de navigation (router/moduleLoader) pour filtrer les pages par `enabled_pages`.  
   - Centraliser **toutes les écritures** dans le Write Gateway (auditLog, entitlements/storage, tenant, safeMode, control-plane/storage, themeManager, localAuth) ; étendre gate write-gateway-coverage à 100 %.  
   - Implémenter **snapshot avant mutation** pour les cibles critiques (matrice tenant, config safe-mode, brand, module-registry, entitlements).  
   - Compléter **Safe Render** avec un moteur d’export PDF/CSV/JSON centralisé et filtre par autorisations.
3. **Phase 2** — Convention manifeste (entitlements_default, data_namespace) ; script auto-discovery (scan `modules/**/manifest` → registry, routing table, nav) ; gate module completeness ; doc “comment ajouter une page” en une procédure unique.
4. **Phase 3** — Tenants (lifecycle, branding, quotas), Subscriptions (portail, metering), Security center, Storage/VFS, Compliance & Audit (export logs), Reliability Center (état santé, incidents, actions).
5. **Phase 4** — CRM, DMS, Work Orders, Calendrier, Facturation, Compta, Analytics, Achats/Inventaire, Intégrations (par modules ou stubs puis enrichissement).
6. **Phase 5** — Pipeline OCR + human-in-the-loop, auto-entry SAFE_MODE, traçabilité IA.
7. **Phase 6** — Observabilité (métriques, traces, SLO), perf (cache, queue, index), sécurité avancée, playbooks/canary, doc produit.
8. **Reliability (Bloc 3)** — Détection (règles statiques + heuristiques + Contract Violation Scanner), auto-réparation 3 niveaux, repair jobs (dry-run, apply, rollback, audit), Reliability Center dans la Console Admin.

## 4.2 Conseils par thème

**Gouvernance**  
- Traiter les blocs (rapport, roadmap, backlog) comme des contrats : une contrainte écrite = à appliquer.  
- Ne pas contourner le Write Gateway : chaque nouvel écrit doit passer par lui (kind, tenantId, correlationId).  
- Documenter toute exception (ex. exclusion d’un test dans gate module completeness) dans un fichier SSOT ou en commentaire justifié.

**Multi-tenant**  
- Faire figurer `tenant_id` (ou `getTenantId()`) dans tout contexte d’écriture et de requête métier.  
- Utiliser `nsKey(base)` pour toute clé de stockage dérivée du tenant.  
- Ajouter des tests contractuels “isolation” (aucune donnée d’un tenant visible par un autre).

**Routes et registries**  
- À chaque nouvelle page : ajouter l’entrée dans `runtime/configs/ssot/ROUTE_CATALOG.json`, puis brancher le rendu dans `app/src/pages/cp/registry.ts` ou `app/src/pages/app/registry.ts` et dans `app/src/moduleLoader.ts` (ou remplacer par le registry généré par auto-discovery).  
- Lancer `npm run gate:route-catalog` et `npm run generate:route-drift` puis `npm run gate:route-drift` après toute modification de routes.

**Design system**  
- Utiliser uniquement les tokens de `runtime/configs/ssot/design.tokens.json` (couleurs, espacements, typo) ; pas de couleurs en dur (hex, rgb, rgba) hors `var(--*)`.  
- Exécuter les audits UI (audit-ui-no-hardcoded-colors, audit-ui-contrast, etc.) et gate:ui-drift avant de merger.

**Tests et CI**  
- Pour chaque nouveau module exposé : au moins un test contractuel ou une entrée “tests_contractuels” dans le manifest.  
- Avant une PR : `npm run gate:ssot` puis `npm run build:cp` (ou build:app selon le périmètre) pour alignement avec la CI.

**Documentation**  
- Tenir à jour governance/docs/ARCH/PATHS_CANONICAL.md et runtime/configs/ssot lorsqu’un nouveau chemin canonique est introduit.  
- Mettre à jour BACKLOG_READY et ACTIONS_RESTANTES_ET_PROGRESSION au fil des livraisons.

## 4.3 Fichiers à modifier en priorité (pour les premiers pas)

| Objectif | Fichiers à modifier / créer |
|----------|-----------------------------|
| Gate tenant isolation | Créer `app/src/__tests__/tenant-isolation.contract.test.ts` ; ajouter le test dans la CI (.github/workflows). |
| TENANT_FEATURE_MATRIX branché | `app/src/core/entitlements/resolve.ts`, `app/src/router.ts` ou guard dans moduleLoader / pages/cp/_shared. |
| Write Gateway 100 % | `app/src/core/audit/auditLog.ts`, `app/src/core/entitlements/storage.ts`, `app/src/core/runtime/tenant.ts`, `app/src/core/runtime/safeMode.ts`, `app/src/core/control-plane/storage.ts`, `app/src/core/ui/themeManager.ts`, `platform-services/security/auth/localAuth.ts` (+ tout autre point d’écriture directe). |
| Route #/docs (DOCS_OCR) | `app/src/router.ts` (getRouteId), `app/src/moduleLoader.ts`, `runtime/configs/ssot/ROUTE_CATALOG.json`, puis page stub ou module documents. |
| Auto-discovery | Créer script dans `scripts/ssot/` ou `scripts/gates/` (scan `modules/**/manifest`), sortie vers `runtime/configs/ssot/` ou artefact + gate drift. |

## 4.4 Commandes indispensables

```bash
# Tests
npm run test:app
npm run test:cp

# Gates (qualité)
npm run gate:ssot
npm run gate:route-catalog
npm run gate:route-drift
npm run generate:route-drift
npm run gate:tenant-matrix
npm run gate:design-tokens
npm run gate:capability-status
npm run gate:check-cross-imports
npm run gate:write-gateway-coverage
npm run gate:routing:ssot

# Audits
./scripts/audit/audit-no-leaks.zsh
./scripts/audit/audit-chemins-non-regression.sh
./scripts/audit/audit-release-candidate.zsh

# Build
npm run build:app
npm run build:cp
npm run build:ssot

# Dev
npm run dev:app    # port 5176, base /app/
npm run dev:cp    # port 5177, base /cp/
```

## 4.5 Références croisées

- **État actuel détaillé :** `docs/REPORT_CURRENT_STATE.md`  
- **Gaps cible vs actuel :** `docs/GAP_MATRIX.md`  
- **Roadmap A→Z :** `docs/EXECUTION_ROADMAP_AZ.md`  
- **Spec auto-adaptatif :** `docs/AUTO_ADAPT_SYSTEM_SPEC.md`  
- **Backlog prêt :** `docs/BACKLOG_READY.md`  
- **Actions restantes + progression :** `docs/ACTIONS_RESTANTES_ET_PROGRESSION.md`  
- **Vision optimale (améliorations) :** `docs/RAPPORT_COMPLET_SYSTEME_ET_VISION_OPTIMALE.md`  
- **Reliability :** `docs/RELIABILITY_SPEC.md`, `docs/RELIABILITY_RUNBOOKS.md`, `docs/REPAIR_JOB_CATALOG.md`, `docs/SLO_SLA_METRICS.md`

---

*Ce rapport consolide chemins, routes, informations primordiales et recommandations pour construire le système décrit dans les rapports et la roadmap. À mettre à jour dès qu’un chemin canonique ou une route change.*
