# D3 — EXECUTION_ROADMAP_AZ (Roadmap A→Z séquencée)

**Source:** Bloc #2 (Mandat enterprise-grade++), D1, D2.  
**Date:** 2026-01-27.

Séquençage non négociable. Pour chaque étape : critères d’acceptation, dépendances, sizing (S/M/L/XL) justifié par l’audit (références fichiers/tests). Estimation = effort par complexité + facteurs observés, pas engagement calendaire.

---

## PHASE 0 — BASELINE & PROOF

| Étape | Description | Critères d’acceptation | Dépendances | Sizing | Fichiers / facteurs |
|-------|-------------|-------------------------|-------------|--------|---------------------|
| 0.1 | Générer D1/D2 (current state + gap matrix) | D1 et D2 publiés, revus | — | S | D1/D2 livrés (docs/) |
| 0.2 | Valider invariants existants (tests, gates) | npm test + gate:ssot passent | — | S | app/src/__tests__, scripts/gates |
| 0.3 | Définir SSOT module registry et état actuel des pages | Document unique : liste pages, module_id, route_id, statut (branché/stub/absent) | 0.1 | M | ROUTE_CATALOG, CP/APP registries, moduleLoader |

**Effort Phase 0 :** S–M. Facteurs : D1/D2 déjà produits ; tests et gates nombreux mais à valider.

---

## PHASE 1 — GOVERNANCE KERNEL HARDENING

| Étape | Description | Critères d’acceptation | Dépendances | Sizing | Fichiers / facteurs |
|-------|-------------|-------------------------|-------------|--------|---------------------|
| 1.1 | Entitlement Resolver (SSOT) + OFF/VIEW/ACTIVE | resolve() utilise TENANT_FEATURE_MATRIX ; chaque page a entitlement OFF/VIEW/ACTIVE ; tests | 0.3 | M | entitlements/resolve.ts, TENANT_FEATURE_MATRIX |
| 1.2 | RBAC/ABAC unifié + SAFE_MODE par tenant/module | Policies chargées ; SAFE_MODE lisible par tenant/module ; tests | 0.3 | L | safeMode.ts, runtime/configs/safe-mode, governance/rbac |
| 1.3 | Write Gateway strict + audit append-only | Toutes écritures storage/runtime/configs/toggles passent par write-gateway ; snapshot pour cibles critiques ; audit append | 0.3 | L | write-gateway/*, auditLog, WRITE_GATEWAY_CONTRACT.md ; dette P1 |
| 1.4 | Safe Render + export engine | Export PDF/CSV/JSON via moteur unique ; filtre par autorisations ; tests | 1.3 | M | studio/engine, safeRender.ts ; pas de moteur central aujourd’hui |
| 1.5 | Tests contractuels obligatoires (CI gates) | Gate tenant isolation ; gate write-gateway coverage 100% ; gates dans CI | 1.3 | M | scripts/gates, .github/workflows |

**Effort Phase 1 :** M–L. Facteurs : Write Gateway partiel (beaucoup d’écritures directes) ; entitlements et SAFE_MODE déjà partiellement en place.

---

## PHASE 2 — AUTO-ADAPT SYSTEM

| Étape | Description | Critères d’acceptation | Dépendances | Sizing | Fichiers / facteurs |
|-------|-------------|-------------------------|-------------|--------|---------------------|
| 2.1 | Standard manifeste module/page | Convention manifest (id, routes, entitlements, data namespace) ; _module-template aligné | 0.3 | M | modules/*/manifest, docs |
| 2.2 | Auto-discovery + génération routes/nav/permissions | Script/build scan manifests → registry, ROUTE_CATALOG, nav, permission matrix ; diff stable | 2.1 | L | moduleLoader, registries, runtime/configs/ssot |
| 2.3 | Lint + gates style system + module completeness | Gate : module sans manifest ou sans test minimal = FAIL ; lint tokens | 2.1 | M | scripts/gates, scripts/audit |
| 2.4 | Release manifest + rollback compatibility | Manifest release versionné ; rollback en 1 commande documenté | 1.3 | S | RUNBOOK_ROLLBACK, releaseops |
| 2.5 | Documentation "comment ajouter une page" (1 procédure) | Doc unique : étapes, manifest, gate, validation | 2.2 | S | docs/ |

**Effort Phase 2 :** L. Facteurs : moduleLoader actuellement manuel (grosse refactor) ; manifests existants mais incomplets.

---

## PHASE 3 — CONSOLE ADMIN (Control Plane) COMPLETE

| Étape | Description | Critères d’acceptation | Dépendances | Sizing | Fichiers / facteurs |
|-------|-------------|-------------------------|-------------|--------|---------------------|
| 3.1 | Tenants (lifecycle, branding, quotas) | CRUD tenant, paramètres, quotas, isolation controls | 1.1 | L | pages/cp/tenants.ts, control-plane |
| 3.2 | Subscriptions (plans, add-ons, entitlements viewer) | Portail plans/add-ons, viewer entitlements par tenant, metering | 1.1 | L | subscription.ts, modules/core-system/subscription |
| 3.3 | Security center (policies, MFA/SSO premium si activé) | Policies, MFA/SSO stub ou intégré, threat signals | 1.2 | XL | Nouveau module |
| 3.4 | Storage center (VFS drivers, retention, backups) | Choix storage, lifecycle, backups, restore test | 1.3 | XL | VFS absent |
| 3.5 | Compliance & Audit viewer | Audit logs consultables/exportables, tamper-proof si requis | 1.3 | M | pages/cp/audit.ts |
| 3.6 | Ops (monitoring, tasks, support mode audité) | Reliability Center, tasks, impersonation audité | Phase 6 + Bloc 3 | L | system, toolbox |

**Effort Phase 3 :** L–XL. Facteurs : tenants et subscription déjà ébauchés ; security/storage/VFS à créer.

---

## PHASE 4 — APP CLIENT (ERP PME)

| Étape | Description | Critères d’acceptation | Dépendances | Sizing | Fichiers / facteurs |
|-------|-------------|-------------------------|-------------|--------|---------------------|
| 4.1 | CRM complet (pipeline, contacts, org, activités) | Leads→Opportunités→Clients, pipeline, contacts, historique | 2.2 | XL | Absent |
| 4.2 | DMS (ingestion, classement IA, recherche) | Upload, tags, recherche, index | 2.2, 5.1 | XL | DOCS_OCR TODO |
| 4.3 | Work Orders / Jobs + checklists + pièces | Ordres de travail, checklists, photos, signatures | 2.2 | XL | Absent |
| 4.4 | Calendrier techniciens + dispatch | Calendrier, affectation, notifications | 2.2 | XL | calendar TODO |
| 4.5 | Devis → facture → paiements + dunning | Chaîne devis/facture, paiements, relances | 2.2 | XL | Absent |
| 4.6 | Comptabilité (core gratuit + exports) | Revenus/dépenses, catégories, exports | 2.2 | L | Absent |
| 4.7 | Analytics dashboards + widgets | Dashboards configurables, KPI, widgets, export | 2.2 | L | dashboard, chart-gallery partiels |
| 4.8 | Achats / Inventaire / Fournisseurs | Fournisseurs, commandes, inventaire | 2.2 | L | inventory TODO |
| 4.9 | Intégrations (email, banques, API) | Connecteurs, webhooks | 2.2 | L | integrations_cp stub |

**Effort Phase 4 :** XL global. Facteurs : tout le métier ERP à construire ; dossiers et dashboard comme base.

---

## PHASE 5 — IA/OCR & AUTOMATION

| Étape | Description | Critères d’acceptation | Dépendances | Sizing | Fichiers / facteurs |
|-------|-------------|-------------------------|-------------|--------|---------------------|
| 5.1 | Pipeline OCR/extraction + human-in-the-loop | Ingestion→OCR→extraction→validation ; seuil confiance, file révision | 4.2 | XL | Absent |
| 5.2 | Auto-entry contrôlé (SAFE_MODE rules) | Écritures IA via Write Gateway, SAFE_MODE suggest-only ou write contrôlé | 1.3, 5.1 | L | — |
| 5.3 | Détection anomalies + suggestions | Règles, suggestions facture/bon | 5.1 | M | — |
| 5.4 | Traçabilité IA (version modèle, hashes, audit) | Logs input hash, version modèle, sorties | 1.3 | M | — |

**Effort Phase 5 :** XL. Facteurs : aucun pipeline IA aujourd’hui.

---

## PHASE 6 — INDUSTRIALISATION (Enterprise++)

| Étape | Description | Critères d’acceptation | Dépendances | Sizing | Fichiers / facteurs |
|-------|-------------|-------------------------|-------------|--------|---------------------|
| 6.1 | Observabilité (metrics/traces/logs) + SLO | Métriques, traces, SLO par surface | 1.5 | L | — |
| 6.2 | Perf (cache, queue, index) + charge tests | Cache, queue, index ; tests charge | 6.1 | L | — |
| 6.3 | Sécurité avancée premium (DLP, etc.) | DLP, scans PII, politiques export | 3.3 | L | — |
| 6.4 | Migration/upgrade playbooks + canary rollout | Playbooks, canary, rollback | 2.4 | M | RUNBOOK_ROLLBACK |
| 6.5 | Documentation produit + runbooks support | Doc produit, runbooks support | — | M | docs/runbooks |

**Effort Phase 6 :** L. Facteurs : observabilité absente ; runbooks partiels.

---

## Dépendances entre phases (résumé)

- **0** → 1, 2.  
- **1** (1.1–1.3) → 2, 3, 5.  
- **1.4, 1.5** → 3, 4, 6.  
- **2** → 3, 4 (catalogue et auto-adapt).  
- **3** → 6 (ops, security).  
- **4** → 5 (DMS, facturation).  
- **5** → 4 (auto-entry).  
- **6** dépend de 1, 2, 3.

---

## Definition of Done (global)

- Multi-tenant : isolement prouvé + tests.  
- Gouvernance : RBAC/SAFE_MODE/Write Gateway/Safe Render prouvés + gates.  
- Catalogue modules/pages : auto-discovery + entitlements + permissions.  
- Core gratuit utilisable end-to-end (CRM + docs + calendrier + facturation simple).  
- Premium = améliorations, jamais nécessaires pour le socle.  
- UI stable : design system tokens + snapshots + zéro CSS sauvage.  
- Observabilité + audit + rollback opérationnels.  
- Doc "comment ajouter une page métier" en 5 minutes, CI garantit le wiring.

*Roadmap alimentant D4 (AUTO_ADAPT_SYSTEM_SPEC), D5 (BACKLOG_READY) et le planning par phase.*
