# Rapport complet du système actuel (A à Z) et vision du meilleur système inimaginable

**Date:** 2026-01-27.  
**Périmètre:** iCONTROL — plateforme PME modulaire (Console Admin + App Client multi-tenant).

---

# PARTIE I — RAPPORT COMPLET DU SYSTÈME ACTUEL (A À Z)

## A. Architecture et structure du dépôt

| Élément | Détail |
|--------|--------|
| **Racine** | Monorepo npm (`package.json` workspaces : app, langs/frontend-ts, modules/*/ui/frontend-ts, shared/*). |
| **App principale** | `app/` — une seule app Vite servie en deux modes : `VITE_APP_KIND=APP` (port 5176, base `/app/`) et `VITE_APP_KIND=CONTROL_PLANE` (port 5177, base `/cp/`). Un bundle par build (app ou cp). |
| **Core kernel** | `core-kernel/` — socle pur (10+ fichiers TS), isolé du reste. |
| **Modules métier** | `modules/core-system/` (subscription + UI : dashboard, account, users, dossiers, developer, system, toolbox, settings, verification, activation, blocked) ; `modules/inventory/` (manifest seul) ; `modules/_module-template/` (référence). |
| **Services plateforme** | `platform-services/` : branding (brandService), security/auth (localAuth), ui-shell (layout/shell.css, shell.ts, routing/router.ts). |
| **Serveur** | `server/` : runtime-config-server.ts, build.mjs, log.mjs, smoke-runtime-config.mjs, ssot-invariants.test.mjs. |
| **Config** | `runtime/configs/` : brand/, branding/, permissions/rbac.json, safe-mode/*.json, ssot/ (ROUTE_CATALOG.json, TENANT_FEATURE_MATRIX.json, design.tokens.json, CAPABILITY_STATUS.json, ADMIN_COMPONENTS_REGISTRY.ts), module-registry.json. |
| **Scripts** | `scripts/` : audit/ (13 scripts), gates/ (26+ fichiers), dev/, release/, maintenance/, runbook/, ssot/, _gates/, gate/, mac/, tools/. |
| **Docs** | `docs/` : adr/, architecture/, contracts/, governance/, release/, releases/, runbooks/, ssot/, ui/, audit/, PHASE_1/, PHASE_2/, _proofs/, + rapports (REPORT_CURRENT_STATE, GAP_MATRIX, EXECUTION_ROADMAP_AZ, etc.). |
| **Applications desktop** | `app-desktop-client/`, `app-desktop-control/` (Tauri/Rust). |

---

## B. Routing et navigation

| Élément | Détail |
|--------|--------|
| **Router** | `app/src/router.ts` — SSOT : getRouteId(hash), CLIENT_V2_ROUTE_IDS / CLIENT_V2_ROUTE_ID_TO_HASH (APP), ADMIN_ROUTE_ALLOWLIST / CLIENT_ROUTE_ALLOWLIST (routeCatalogLoader), guard dev-only, version policy, auditWarnOnce. |
| **Route catalog** | `runtime/configs/ssot/ROUTE_CATALOG.json` — routes avec route_id, path, app_surface (CP/CLIENT), page_module_id, permissions_required, tenant_visibility, status. |
| **Registries** | `app/src/pages/cp/registry.ts` (CP_PAGES_REGISTRY) ; `app/src/pages/app/registry.ts` (APP_PAGES_REGISTRY). Entrées : routeId, render (async), async. |
| **Module loader** | `app/src/moduleLoader.ts` — renderRoute(rid, root) : chaîne if/else par route_id (users_cp, account_cp, dossiers_cp, developer_cp, developer_entitlements_cp, verification_cp, system_cp, logs_cp, settings_cp, settings_branding_cp, tenants_cp, entitlements_cp, pages_cp, feature-flags_cp, publish_cp, audit_cp, subscription_cp, integrations_cp, login_cp, dashboard_cp, access_denied_cp, blocked_cp, notfound_cp, toolbox_cp, runtime_smoke_cp) avec import() dynamique vers modules/core-system/ui/frontend-ts/pages/* ou app/pages/cp/*. Pour APP : home_app, client_disabled_app, access_denied_app, client_catalog_app, pages_inventory_app, notfound_app. |
| **Pages CP** | login, dashboard, account, settings, settings-branding, users, system, subscription, tenants, entitlements, pages, feature-flags, publish, audit, integrations, login-theme, blocked, notfound, ui-catalog, ui-showcase, access-denied. |
| **Pages APP** | home-app, client-disabled, client-access-denied, client-catalog, client-pages-inventory, notfound. |

---

## C. Gouvernance et sécurité

| Élément | Détail |
|--------|--------|
| **SAFE_MODE** | `app/src/core/runtime/safeMode.ts` — isSafeMode() (window.__ICONTROL_SAFE_MODE__ ou localStorage icontrol.runtime.safeMode.v1). Bloque écritures (auditLog, entitlements, etc.). setSafeMode(on). Config : runtime/configs/safe-mode/*.json. |
| **RBAC** | runtime/configs/permissions/rbac.json (USER, ADMIN, SYSADMIN, DEVELOPER). app/src/core/governance/rbac/ (enforce, policy, ranks, types). app/src/core/runtime/rbac.ts (canAccessSettings, canAccessToolbox). |
| **Write Gateway** | app/src/core/write-gateway/ : writeGateway.ts (createWriteGateway, createCorrelationId), policyHook.ts, auditHook.ts, contracts.ts, adapters/legacyAdapter.ts. Contrat : kind, tenantId, correlationId obligatoires ; policy + audit + adapter. Écritures directes encore présentes (localStorage, saveEntitlements) — non 100 % centralisées. |
| **Audit** | app/src/core/audit/auditLog.ts — readAuditLog, writeAuditLog, appendAuditEvent ; nsKey ; intégration Write Gateway (shadow). policies/audit.emit.ts, audit.redact.ts, audit.scopes.ts. |
| **Entitlements** | app/src/core/entitlements/ (storage, resolve, gates, requireEntitlement, types, warnings). TENANT_FEATURE_MATRIX (FREE/PRO/ENTERPRISE) défini ; non branché dans guard de navigation. |
| **Feature flags** | policies/feature_flags.* (boot, capabilities, enforce, governance, loader, merge, runtime, schema), feature_flags.default.json. |
| **Version policy** | policies/version_policy.* (boot, default, enforce, loader, runtime, schema). |
| **Trace context** | policies/trace.context.ts — enrichissement payload tenant/traceId/requestId. |

---

## D. Multi-tenant et données

| Élément | Détail |
|--------|--------|
| **Tenant** | app/src/core/runtime/tenant.ts — getTenantId() (localStorage icontrol.runtime.tenantId.v1, défaut "public"), setTenantId(id). Intégration Write Gateway (shadow). |
| **Namespaces** | app/src/core/runtime/storageNs.ts — nsKey(base) → icontrol.t.${tenant}.${base}. Utilisé par auditLog, entitlements/storage. |
| **Entitlements storage** | app/src/core/entitlements/storage.ts — entitlementsKey(tenantId), saveEntitlements, etc. |
| **Control plane storage** | app/src/core/control-plane/storage.ts — LocalStorageProvider stub. |

---

## E. Design system et UI

| Élément | Détail |
|--------|--------|
| **Tokens** | runtime/configs/ssot/design.tokens.json (base, cp, presets cp-dashboard-charcoal, app-foundation-slate). app/src/core/theme/ (themeTokens, loadPreset, applyThemeCssVars, themeManifest, presets/*.json). |
| **Génération CSS** | scripts/gates/generate-design-tokens-css.mjs. app/src/styles/tokens.generated.css. |
| **Styles** | app/src/styles/STYLE_ADMIN_FINAL.css, STYLE_CLIENT_FINAL.css. platform-services/ui-shell/layout/shell.css. |
| **Composants** | app/src/core/ui/ (catalog, registry, themeManager, dataTable, modal, pageShell, sectionCard, toolbar, toast, confirmModal, emptyState, errorState, skeletonLoader, kpi, charts, badge, button, inlineCss, clientSidebar.tsx). |
| **Studio** | app/src/core/studio/ — blueprints, datasources, engine (safe-render, serializer, html-guards), registry (builtins form, table), rules, runtime (execute, plan, render, studioRuntime). |
| **Modules UI** | modules/core-system/ui/frontend-ts/pages/_shared/ (uiBlocks, themeCssVars, sections, safeMode, rolePolicy, storage, audit, entitlements, localAuth, recommendations, etc.). |

---

## F. Subscription et modules métier

| Élément | Détail |
|--------|--------|
| **Subscription** | modules/core-system/subscription/ — SubscriptionService, SubscriptionResolver, SubscriptionRegistry, FileSubscriptionStore (node/browser), Entitlements, Plans, Policy, ProviderPort, AuditTrail, etc. |
| **Subscription API** | app/src/core/subscription/ (entitlementsApi, registryApi, subscriptionServiceFactory). |
| **Module registry** | runtime/configs/module-registry.json — core-system (core), dossiers, clients, inventory, documents, ocr, finance, billing, quotes, jobs, calendar, reports, contacts, payments, integrations-hub (complementary). |
| **Manifests** | modules/core-system/manifest/manifest.json (id, routes, permissions, storageScopes, flags). modules/_module-template/manifest/manifest.json. modules/inventory/manifest/manifest.json. |
| **Dossiers** | Module dossiers branché (#/dossiers) — modules/core-system/ui/frontend-ts/pages/dossiers/ (list, detail, filters, bulk, storage, safe-mode, actions, create, history, rules). |

---

## G. Tests et qualité

| Élément | Détail |
|--------|--------|
| **Framework** | Vitest. app/vitest.setup.ts, app/src/vitest.setup.ts. |
| **Tests** | app/src/__tests__/ (~101 fichiers) — contract tests (audit, subscription, control-plane, storage, cache, write-gateway, studio, tenant-isolation, GATES_SELF_HEAL), router, app-cp-guard, policies, ssot, etc. modules/core-system/ui/frontend-ts/pages/*/index.test.ts, *.test.ts. |
| **Gates** | package.json : gate:ssot, gate:route-catalog, gate:route-drift, gate:tenant-matrix, gate:design-tokens, gate:capability-status, gate:admin-components-registry, gate:check-cross-imports, gate:write-gateway-coverage, gate:write-surface-map, gate:routing:ssot, gate:rg-n-safety, gate:ui-drift, gate:gates:sanity, etc. |
| **Scripts gates** | scripts/gates/*.mjs (check-route-catalog, check-tenant-feature-matrix, check-design-tokens, check-capability-status, check-admin-components-registry, check-cp-app-cross-imports, check-route-drift, gate-routing-ssot, gate-ssot-paths, gate-write-gateway-coverage, gate-write-surface-map, gate-rg-n-safety, etc.). |
| **Audits** | scripts/audit/ (audit-no-leaks.zsh, audit-chemins-non-regression.sh, audit-release-candidate.zsh, audit-ui-contrast, audit-ui-no-hardcoded-colors, audit-ui-theme-cssvars, audit-ui-cssvars-rollout, audit-ui-cssvars-backlog-shared, audit-subscription-no-ui-coupling, audit-no-node-builtins-in-app, audit-no-node-builtins-in-client-surface, audit-system-complete.mjs). |
| **CI** | .github/workflows/ : ssot-gates.yml, ci-test.yml, cp-proofs.yml, server-ssot.yml, releaseops-gate.yml, ssot-verify.yml. |
| **Hooks** | .githooks/pre-commit, pre-push, pre-commit-orchestrator, post-commit. |

---

## H. Build et déploiement

| Élément | Détail |
|--------|--------|
| **Build** | npm run build:app (VITE_APP_KIND=APP, base /app/, outDir dist/app) ; npm run build:cp (CONTROL_PLANE, base /cp/, outDir dist/cp) ; npm run build:ssot (les deux). |
| **Dev** | npm run dev:app (port 5176), npm run dev:cp (port 5177), npm run dev:both. |
| **Server** | npm run server:build, server:dev, server:prod. local:web:build, local:web:serve. |
| **Desktop** | npm run desktop:app, desktop:cp, desktop:dev:app, desktop:dev:cp (Tauri). |

---

## I. Conventions et nomenclature

| Élément | Détail |
|--------|--------|
| **Codes erreur** | ERR_*, WARN_* utilisés dans router, moduleLoader, dashboard, tenants, localAuth, studio, _shared/sections. Pas de taxonomie centralisée (SECURITY/DATA/PERF/UX). |
| **Plan visuel** | docs/ssot/STYLE_INVENTORY, DESIGN_SYSTEM_SSOT. Tokens et arborescence UI dans runtime/configs/ssot et core/theme. |
| **Routes** | Suffixes _cp (Control Plane) et _app (Client). Pas de route partagée entre les deux surfaces. |
| **Paths canoniques** | governance/docs/ARCH/PATHS_CANONICAL.md, docs/ssot/governance/docs/ARCH/PATHS_CANONICAL.md. |

---

## J. Ce qui est absent ou partiel (résumé)

- **Absent :** CRM, DMS, Work Orders, Calendrier, Facturation, Comptabilité, IA/OCR, VFS, Security Center (MFA/SSO, DLP), Support (impersonation), observabilité (métriques, traces, SLO), auto-discovery, repair jobs runtime.
- **Partiel :** Write Gateway (écritures directes restantes), TENANT_FEATURE_MATRIX (non branché dans guard), Safe Render (pas de moteur export central), SAFE_MODE/RBAC (global uniquement, pas par tenant/module), thèmes Admin/Client (pas de cloisonnement strict), menus (codés en dur).

---

# PARTIE II — AMÉLIORATIONS / MODIFICATIONS / AJOUTS POUR LE MEILLEUR SYSTÈME INIMAGINABLE

Vision au-delà de la roadmap actuelle : architecture, UX, DX, sécurité, scalabilité, produit, fiabilité, accessibilité, internationalisation, performance.

---

## 1. Architecture et fondations

| # | Amélioration | Description |
|---|--------------|-------------|
| A1 | **Backend API dédié** | Séparer un vrai backend (Node/Go/Rust) pour auth, persistence, jobs, métriques — au lieu de tout côté client (localStorage). API REST ou GraphQL avec contrat versionné. |
| A2 | **Event-driven kernel** | Bus d’événements interne (Blueprint → compilePlan → RenderPlan → executePlan → safeRender) étendu : tous les writes et changements d’état émis comme événements ; réplay, audit, time-travel debug. |
| A3 | **CQRS léger** | Séparation lecture/écriture : Write Gateway = commandes ; modèles de lecture optimisés (cache, vues) pour dashboards et listes. |
| A4 | **Modules fédérés** | Chaque module = micro-frontend ou package versionné indépendant ; chargement dynamique par entitlements ; pas de monolithe UI unique. |
| A5 | **Schema-first** | Toutes les APIs et stores définis par schémas (JSON Schema / OpenAPI / Zod) ; génération types + validation + doc. |
| A6 | **Feature flags distribués** | Service de feature flags (LaunchDarkly-like) avec rollout %, audiences, A/B ; pas seulement fichier statique. |

---

## 2. Multi-tenant et isolation

| # | Amélioration | Description |
|---|--------------|-------------|
| M1 | **Tenant par domaine/sous-domaine** | Détection tenant automatique (hostname, cookie, JWT) ; plus de sélecteur manuel localStorage. |
| M2 | **Database par tenant (ou schéma)** | Persistence réelle par tenant : DB dédiée ou schéma par tenant ; zéro risque de fuite. |
| M3 | **Quotas et metering en temps réel** | Compteurs (storage, API calls, OCR pages, jobs) par tenant ; alertes et blocage au seuil. |
| M4 | **Régions et conformité** | Choix région par tenant (EU, US, etc.) ; données hébergées localement ; conformité RGPD/SOC2 par design. |
| M5 | **Tenant provisioning automatisé** | Création tenant en 1 clic (template) ; onboarding guidé ; sandbox pour essai. |

---

## 3. Gouvernance et sécurité

| # | Amélioration | Description |
|---|--------------|-------------|
| S1 | **Write Gateway 100 % + event sourcing optionnel** | Toutes les écritures passent par le gateway ; log des commandes rejouable (event store) pour audit et recovery. |
| S2 | **ABAC et policy engine** | Policies en langage déclaratif (OPA/Rego ou équivalent) ; attributs (rôle, département, heure, IP) ; décisions auditées. |
| S3 | **SAFE_MODE granulaire** | Par tenant, par module, par action (read-only, no-export, no-delete) ; UI reflète l’état en temps réel. |
| S4 | **Secrets et KMS** | Aucun secret en clair ; rotation automatique ; HSM ou KMS cloud pour clés critiques. |
| S5 | **Zero-trust réseau** | Authentification mutuelle, mTLS ou équivalent pour services internes ; pas de confiance implicite par réseau. |
| S6 | **Audit immuable** | Logs d’audit en WORM (append-only, non modifiable) ; hash chaîné ; export pour conformité. |
| S7 | **MFA / SSO obligatoire (premium)** | Intégration IdP (SAML/OIDC) ; MFA (TOTP, WebAuthn) ; device trust. |

---

## 4. UX et design system

| # | Amélioration | Description |
|---|--------------|-------------|
| U1 | **Design system vivant** | Storybook ou catalogue UI avec tous les composants ; variants, états, accessibilité ; génération de code et tokens. |
| U2 | **Thèmes illimités** | Pas seulement Admin/Client : thème par tenant (branding), thème utilisateur (dark/light/system), thème par rôle (high-contrast). |
| U3 | **Mode accessible (A11y)** | WCAG 2.1 AA minimum ; focus visible, contraste, lecteurs d’écran ; raccourcis clavier cohérents. |
| U4 | **Responsive et mobile-first** | Toutes les pages utilisables sur mobile ; PWA ou app native (Tauri déjà présent) ; offline-first pour terrain. |
| U5 | **Micro-interactions et feedback** | Loading states, skeletons, toasts, confirmations ; pas de clic sans retour visuel. |
| U6 | **Onboarding et empty states** | Premier usage guidé ; vides expliqués avec CTA (créer premier client, importer premier doc). |
| U7 | **Recherche globale** | Barre de recherche (cmd+K) : pages, entités, actions ; résultats instantanés. |
| U8 | **Raccourcis clavier** | Raccourcis pour toutes les actions fréquentes ; aide (?) listant les raccourcis. |

---

## 5. Observabilité et fiabilité

| # | Amélioration | Description |
|---|--------------|-------------|
| O1 | **Métriques et SLO** | Prometheus/OpenTelemetry ; latence p50/p95/p99, taux erreurs, saturation ; SLO par surface avec alerting. |
| O2 | **Traces distribuées** | Trace_id sur toute la chaîne (front → API → DB → jobs) ; corrélation avec tenant_id, user_id. |
| O3 | **Logs structurés et taxonomie** | JSON ; champs obligatoires (level, code ERR_*/WARN_*, category SECURITY/DATA/PERF/UX, tenant_id, trace_id) ; agrégation et recherche. |
| O4 | **Reliability Center opérationnel** | Dashboard santé global + par tenant + par module ; incidents, timeline, root cause ; actions (restart, rebuild, rollback). |
| O5 | **Auto-réparation 3 niveaux** | Niveau 1 (restart, purge cache, circuit breaker) ; Niveau 2 (fix gouverné avec snapshot) ; Niveau 3 (Patch Plan uniquement). |
| O6 | **Chaos engineering** | Scénarios automatisés (panne DB, queue, latence) ; le système revient OK ; runbooks associés. |
| O7 | **Status page publique** | Page de statut (uptime, incidents) pour les clients ; transparence. |

---

## 6. Performance et scalabilité

| # | Amélioration | Description |
|---|--------------|-------------|
| P1 | **Cache multi-niveaux** | Cache applicatif (LRU), cache HTTP (CDN), cache DB (requêtes lourdes) ; invalidation par événement. |
| P2 | **Lazy loading et code splitting** | Chaque page/module en chunk ; chargement à la demande ; préchargement des routes probables. |
| P3 | **Index et recherche** | Index full-text (Elasticsearch/Meilisearch ou équivalent) pour docs, CRM, jobs ; recherche en < 100 ms. |
| P4 | **Queue et jobs asynchrones** | Jobs lourds (OCR, export, rapports) en queue ; workers scalables ; retry et dead-letter. |
| P5 | **CDN et assets** | Assets statiques (JS, CSS, images) sur CDN ; versioning par hash ; cache long. |
| P6 | **Compression et minification** | Brotli/gzip ; tree-shaking ; analyse de bundle pour éviter le bloat. |

---

## 7. Développeur et opérations

| # | Amélioration | Description |
|---|--------------|-------------|
| D1 | **Doc "ajouter une page" en 5 min** | Procédure unique ; CLI ou script qui génère manifest + squelette page + test ; CI valide le wiring. |
| D2 | **Environnements (dev, staging, prod)** | Config par environnement ; secrets injectés ; pas de clés en dur. |
| D3 | **CI/CD complet** | Pipeline : lint, test, build, gate, déploiement staging puis prod (canary ou blue-green) ; rollback en 1 clic. |
| D4 | **API publique documentée** | OpenAPI/Swagger ; génération client SDK ; versioning (v1, v2). |
| D5 | **Sandbox et démo** | Environnement de démo pré-rempli (tenants, données) ; reset propre pour démos. |
| D6 | **Métriques de qualité code** | Couverture tests, dette technique (SonarQube ou équivalent), dépendances à jour (Renovate/Dependabot). |

---

## 8. Produit et métier

| # | Amélioration | Description |
|---|--------------|-------------|
| B1 | **CRM ultra complet** | Pipeline visuel (drag-drop), scoring, prévisions, campagnes, e-signature, intégration email/téléphone. |
| B2 | **DMS avec IA** | Classification automatique, extraction (factures, reçus), règles d’assignation, workflow de validation. |
| B3 | **Field service de bout en bout** | Calendrier, dispatch, optimisation tournées, ETA, signature client, mode offline, synchro. |
| B4 | **Facturation et paiements** | Devis → bon → facture ; génération auto ; portail client ; relances ; intégration paiement (Stripe, etc.). |
| B5 | **Comptabilité et reporting** | Grand livre, rapprochement, P&L, balance ; exports comptables ; multi-devises si besoin. |
| B6 | **Analytics et BI** | Dashboards configurables ; requêtes ad hoc ; exports ; alertes sur seuils. |
| B7 | **Marketplace de modules** | Catalogue de modules tiers (payants ou gratuits) ; installation en 1 clic ; compatibilité versionnée. |
| B8 | **Templates et bonnes pratiques** | Templates par industrie (plombier, IT, construction) ; bonnes pratiques intégrées. |

---

## 9. Internationalisation et accessibilité

| # | Amélioration | Description |
|---|--------------|-------------|
| I1 | **i18n complète** | Toutes les chaînes en clés (format ICU ou JSON) ; langue par tenant ou par utilisateur ; dates/nombres/devises localisés. |
| I2 | **RTL et locales** | Support RTL (arabe, hébreu) ; formats locaux (adresses, téléphones). |
| I3 | **A11y par défaut** | Composants accessibles (ARIA, roles, labels) ; tests automatisés (axe, Pa11y) ; formation équipe. |
| I4 | **Personnalisation utilisateur** | Préférences (langue, fuseau, format date, densité UI) stockées par utilisateur. |

---

## 10. Résilience et coût

| # | Amélioration | Description |
|---|--------------|-------------|
| R1 | **Circuit breaker partout** | Toutes les dépendances externes (API, DB, queue) avec circuit breaker ; fallback gracieux. |
| R2 | **Rate limiting et quotas** | Limitation par tenant et par utilisateur ; évite abus et contrôle les coûts. |
| R3 | **Coûts visibles** | Dashboard coûts par tenant (storage, API, OCR, jobs) ; alertes budget ; facturation transparente. |
| R4 | **Dégradation gracieuse** | Si un module ou un service est down, le reste fonctionne ; messages clairs ("module temporairement indisponible"). |

---

## Synthèse vision "meilleur système inimaginable"

- **Architecture :** Backend dédié, event-driven, CQRS léger, modules fédérés, schema-first.  
- **Multi-tenant :** Tenant par domaine, DB/schéma par tenant, quotas temps réel, régions, provisioning auto.  
- **Sécurité :** Write Gateway 100 % + event sourcing, ABAC, SAFE_MODE granulaire, KMS, audit immuable, MFA/SSO.  
- **UX :** Design system vivant, thèmes illimités, A11y, mobile-first, recherche globale, raccourcis, onboarding.  
- **Observabilité :** Métriques, traces, logs taxonomisés, Reliability Center, auto-réparation 3 niveaux, chaos, status page.  
- **Performance :** Cache multi-niveaux, lazy loading, index recherche, queue jobs, CDN.  
- **DX/Ops :** Doc 5 min, envs, CI/CD, API documentée, sandbox, qualité code.  
- **Produit :** CRM/DMS/Field service/Facturation/Compta/Analytics complets, marketplace modules, templates industrie.  
- **i18n/A11y :** i18n complète, RTL, accessibilité par défaut, préférences utilisateur.  
- **Résilience :** Circuit breaker, rate limiting, coûts visibles, dégradation gracieuse.

Ce document sert de boussole pour prioriser les évolutions au-delà de la roadmap actuelle.
