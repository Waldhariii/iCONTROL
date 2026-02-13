# D2 — GAP_MATRIX (Cible vs actuel)

**Source:** Bloc #1 (système cible A→Z) vs D1 (REPORT_CURRENT_STATE).  
**Date:** 2026-01-27.

Légende : **Absent** = non implémenté ; **Partiel** = partiellement implémenté ; **Complet** = aligné cible.  
Colonnes : État | Fichiers / preuves | Tests associés | Action prioritaire

---

## A. Core Kernel & Gouvernance

| Capacité cible | État | Fichiers / Preuves | Tests | Action |
|----------------|------|--------------------|-------|--------|
| Identity & Access (utilisateurs, invites, groups) | Partiel | `app/src/core/governance/rbac/`, `runtime/configs/permissions/rbac.json`, localAuth, control-plane/storage | rbac, control-plane tests | Compléter ABAC, policies, scopes |
| RBAC/ABAC + policies + permission matrix | Partiel | rbac.json (4 rôles), governance/rbac, runtime/rbac (canAccess*) | role-policy.test, execute.rbac.test | Étendre rules, policy engine |
| SAFE_MODE global + par tenant + par module | Partiel | safeMode.ts, runtime/configs/safe-mode/*.json | safe-mode-write.test | Brancher par tenant/module, config |
| Write Gateway unique (validation, idempotence, audit, policy) | Partiel | write-gateway/*, WRITE_GATEWAY_CONTRACT.md | write-gateway coverage gate | Centraliser toutes écritures, snapshot/rollback |
| Data namespaces (tenant_id obligatoire) | Complet | storageNs.ts, auditLog, entitlements/storage | storage-namespace.contract.test | — |
| Feature Gate + Entitlement Resolver (SSOT) | Partiel | entitlements/*, TENANT_FEATURE_MATRIX | subscription-*, entitlements tests | Brancher TENANT_FEATURE_MATRIX dans guard |
| Safe Render (exports/UI filtrés) | Partiel | safeRender.ts (minimal), studio/engine/safe-render | studio tests | Moteur export PDF/CSV + filtre accès |
| Audit trail append-only | Partiel | audit/auditLog.ts, write-gateway auditHook | audit*.contract.test | Garantir append-only, structure invariants |
| Logs structurés + ERR_*/WARN_* | Partiel | router, moduleLoader, dashboard, tenants, logger | — | Taxonomie centralisée (SECURITY/DATA/PERF/UX) |
| Observabilité (metrics, traces, SLO) | Absent | — | — | Spécifier + implémenter (Phase 6) |

---

## B. Console Admin (Control Plane)

| Capacité cible | État | Fichiers / Preuves | Tests | Action |
|----------------|------|--------------------|-------|--------|
| Subscription & Billing Ops | Partiel | pages/cp/subscription.ts, modules/core-system/subscription | subscription-*.contract.test | Portail upgrade/downgrade, metering |
| Module Catalog (pages activables/désactivables) | Partiel | module-registry.json, ROUTE_CATALOG, TENANT_FEATURE_MATRIX | capability-status gate | Brancher matrix dans nav/guard |
| Security Center (MFA/SSO, policies, DLP) | Absent | — | — | Phase 3.3 |
| Storage & Data Governance (VFS, lifecycle, backups) | Absent | — | — | Phase 3.4 |
| Compliance & Audit (logs consultables/exportables) | Partiel | pages/cp/audit.ts, auditLog | audit tests | Export, tamper-proof si requis |
| Ops & Reliability (monitoring, jobs, task runner) | Partiel | system, logs, toolbox, cache-audit | cache-audit tests | Reliability Center (Bloc 3) |
| Support (impersonation audité, playbooks) | Absent | — | — | Phase 3.6 |

---

## C. Application Client (ERP PME)

| Capacité cible | État | Fichiers / Preuves | Tests | Action |
|----------------|------|--------------------|-------|--------|
| CRM (leads, opportunités, contacts, pipeline) | Absent | — | — | Phase 4.1 |
| DMS (ingestion, classement IA, recherche) | Absent | — | — | Phase 4.2 |
| Work Orders / Jobs + checklists + pièces | Absent | — | — | Phase 4.3 |
| Calendrier techniciens + dispatch | Absent | — | — | Phase 4.4 |
| Devis → facture → paiements + dunning | Absent | — | — | Phase 4.5 |
| Comptabilité (core gratuit + premium) | Absent | — | — | Phase 4.6 |
| Analytics dashboards + widgets | Partiel | dashboard (CP), system/chart-gallery | — | Phase 4.7, widgets modulaires |
| Intégrations (email, banques, API) | Absent | — | — | Phase 4.9 |

---

## D. Modules / Pages métier (sélection par tenant)

| Capacité cible | État | Fichiers / Preuves | Tests | Action |
|----------------|------|--------------------|-------|--------|
| Manifeste module (id, routes, entitlements OFF/VIEW/ACTIVE) | Partiel | core-system/manifest, _module-template | — | Convention SSOT, champs entitlements |
| Auto-discovery (registry, routes, nav, permissions) | Absent | moduleLoader manuel, CP/APP registries | — | Phase 2.2 |
| Matrice tenant → plan → rôle → Safe Mode | Partiel | TENANT_FEATURE_MATRIX, rbac.json | tenant-matrix gate | Brancher dans resolve + guard |
| Gate module completeness (manifest + test minimal) | Absent | — | — | Phase 2.3 |

---

## E. Pipeline IA / OCR

| Capacité cible | État | Fichiers / Preuves | Tests | Action |
|----------------|------|--------------------|-------|--------|
| OCR / extraction / classement automatique | Absent | — | — | Phase 5.1 |
| Human-in-the-loop (seuil, file révision) | Absent | — | — | Phase 5.1 |
| Traçabilité IA (version modèle, hashes, audit) | Absent | — | — | Phase 5.4 |
| Auto-entry contrôlé (SAFE_MODE) | Absent | — | — | Phase 5.2 |

---

## F. Sécurité / Stockage / Opérations

| Capacité cible | État | Fichiers / Preuves | Tests | Action |
|----------------|------|--------------------|-------|--------|
| Auth robuste, sessions, rate limiting | Partiel | localAuth, platform-services/security | — | Renforcer rate limit, sessions |
| Chiffrement au repos/en transit | — | Non audité (client-side) | — | Spécifier périmètre |
| VFS (local/cloud/hybride) | Absent | — | — | Phase 3.4 / 6 |
| Backups / snapshots / restore | Absent | — | — | Phase 6 |
| Gates qualité (tenant_id, Write Gateway, Safe Render, entitlements) | Partiel | Gates SSOT, write-gateway-coverage | CI | Ajouter gate tenant isolation, compléter Write Gateway |
| Release manifest + rollback | Partiel | releaseops, RUNBOOK_ROLLBACK | — | Phase 6.4 |

---

## G. UX / Design system

| Capacité cible | État | Fichiers / Preuves | Tests | Action |
|----------------|------|--------------------|-------|--------|
| Tokens centralisés (couleurs, spacing, typo) | Complet | runtime/configs/ssot/design.tokens.json, core/theme | gate:design-tokens | — |
| Thèmes Admin vs Client isolés | Partiel | presets cp-dashboard-charcoal, app-foundation-slate | — | Cloisonner stricte par surface |
| Zéro CSS ad hoc (design system uniquement) | Partiel | Audits UI (no-hardcoded-colors, cssvars) | gate:ui-drift | Renforcer lint, migration |
| Catalogue UI / snapshots régressions | Partiel | ui-catalog-snap, cp-visual-snap | — | Intégrer en CI |

---

## Synthèse des gaps actionnables

1. **Write Gateway** : centraliser toutes écritures, snapshot/rollback (P1).  
2. **TENANT_FEATURE_MATRIX** : brancher dans entitlements + guard navigation (P2).  
3. **Gate tenant isolation** : tests + gate CI (P2).  
4. **Auto-discovery** : manifestes + scan build → registry/routes/nav (Phase 2).  
5. **Console Admin complète** : tenants, subscription, security, storage, ops, support (Phase 3).  
6. **App Client** : CRM, DMS, Jobs, Calendrier, Facturation, Compta, Analytics (Phase 4).  
7. **IA/OCR** : pipeline + human-in-the-loop + traçabilité (Phase 5).  
8. **Reliability** : observabilité, SLO, auto-audit, auto-réparation (Bloc 3 + Phase 6).

*Matrice alimentant D3 (EXECUTION_ROADMAP_AZ) et D5 (BACKLOG_READY).*
