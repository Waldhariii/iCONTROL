# D5 — BACKLOG_READY (Tickets prêts à exécuter)

**Source:** D1, D2, D3, D4. Priorisation security/tenant-isolation/perf en premier.  
**Date:** 2026-01-27.

Chaque ticket : titre, objectif, fichiers impactés, tests, risques. Ordre = priorité.

---

## P1 — Sécurité / Gouvernance (Write Gateway)

| # | Titre | Objectif | Fichiers impactés | Tests | Risques |
|---|-------|----------|-------------------|------|--------|
| B1 | Centraliser écritures dans Write Gateway | Toutes les écritures storage/config/toggles passent par write-gateway ; plus de localStorage.setItem/saveEntitlements direct | app/src/core/write-gateway/*, auditLog.ts, entitlements/storage.ts, runtime/tenant.ts, safeMode.ts, control-plane/storage.ts, themeManager, localAuth | Étendre gate:write-gateway-coverage ; tests contractuels write-gateway | Régression si oubli d’un chemin d’écriture |
| B2 | Snapshot avant mutation (cibles critiques) | Snapshot pour matrice tenant, config safe-mode, brand, module-registry, entitlements | write-gateway adapters, nouveau service snapshot (ou adapter) | Tests rollback, SNAPSHOT_ROLLBACK_POLICY | Complexité rollback |

---

## P2 — Multi-tenant / Entitlements

| # | Titre | Objectif | Fichiers impactés | Tests | Risques |
|---|-------|----------|-------------------|------|--------|
| B3 | Brancher TENANT_FEATURE_MATRIX dans entitlements + guard | resolve() et guard de navigation filtrent les pages par plan (enabled_pages) ; une page non autorisée pour le plan = redirect ou access-denied | app/src/core/entitlements/resolve.ts, router.ts, moduleLoader.ts, pages/cp/_shared (guard) | Tests subscription + entitlements ; gate tenant-matrix | Faux positifs si matrix incomplète |
| B4 | Gate tenant isolation (tests + CI) | Aucune route rendue sans tenant context ; aucun write sans tenant_id ; tests contractuels | Nouveau fichier __tests__/tenant-isolation.contract.test.ts, .github/workflows | Tests isolation, pas de cross-tenant | — |
| B5 | DOCS_OCR — route #/docs + module documents | Ajouter route_id docs_cp ou docs_app, page stub ou réelle, brancher dans getRouteId et moduleLoader | app/src/router.ts, moduleLoader.ts, config/ssot/ROUTE_CATALOG.json, modules ou app/pages | gate:route-catalog, gate:route-drift | — |

---

## P2 — Qualité / Anti-régression

| # | Titre | Objectif | Fichiers impactés | Tests | Risques |
|---|-------|----------|-------------------|------|--------|
| B6 | PAGE_BOUNDARY_LINT (cross-imports pages) | Renforcer interdiction page→page ; lint ou gate | ESLint config ou scripts/gates | gate:check-cross-imports | — |
| B7 | Safe Render — moteur export PDF/CSV centralisé | Un seul moteur d’export ; filtre par autorisations (tenant, rôle) | Nouveau module ou app/src/core/export/, studio/engine | Tests export + filtre | Régression exports existants |

---

## P3 — Auto-adapt (Phase 2)

| # | Titre | Objectif | Fichiers impactés | Tests | Risques |
|---|-------|----------|-------------------|------|--------|
| B8 | Convention manifeste module (champs entitlements, data_namespace) | Étendre manifests existants ; documenter dans AUTO_ADAPT_SYSTEM_SPEC | modules/core-system/manifest, _module-template, docs/AUTO_ADAPT_SYSTEM_SPEC.md | — | — |
| B9 | Script auto-discovery (scan manifests → artefacts) | Script Node : scan modules/**/manifest, sortie registry + routing table + nav + permission matrix | scripts/gates ou scripts/ssot/, config/ssot/ | Gate drift (comparaison généré vs ROUTE_CATALOG) | Décalage manuel vs généré |
| B10 | Gate module completeness | Pour chaque route exposée, manifest + test minimal requis | scripts/gates/gate-module-completeness.mjs (nouveau) | CI | Faux positifs si exclusions nécessaires |
| B11 | Doc "comment ajouter une page" (1 procédure) | Rédiger procédure unique (voir D4 §6) | docs/ | — | — |

---

## P3 — Console Admin (Phase 3, premiers pas)

| # | Titre | Objectif | Fichiers impactés | Tests | Risques |
|---|-------|----------|-------------------|------|--------|
| B12 | Tenant Management — lifecycle complet | Création/activation/suspension tenant, paramètres, isolation controls | pages/cp/tenants.ts, control-plane/tenantService | Tests tenants | — |
| B13 | Subscription — portail upgrade/downgrade + metering | UI plans/add-ons, viewer entitlements, consommation quotas | pages/cp/subscription.ts, modules/core-system/subscription | subscription-*.contract.test | — |
| B14 | Compliance & Audit — export logs | Audit logs exportables (CSV/JSON), tamper-proof si requis | pages/cp/audit.ts, auditLog | audit tests | — |

---

## P4 — App Client (Phase 4, découpage)

| # | Titre | Objectif | Fichiers impactés | Tests | Risques |
|---|-------|----------|-------------------|------|--------|
| B15 | CRM — stub module + route #/crm | Module CRM minimal (manifest + page stub), route branchée | modules/ ou app/pages, ROUTE_CATALOG, moduleLoader | gate:route-catalog | — |
| B16 | DMS — stub module + route #/docs | Module documents minimal, route #/docs (CP ou APP) | Idem B5 + module dédié | — | — |
| B17 | Calendrier — stub module + route | Module calendar minimal, route #/calendar | CAPABILITY_STATUS, module-registry | — | — |
| B18 | Facturation — stub module + route | Module billing/invoicing minimal | — | — | — |

---

## Reliability (Bloc 3)

| # | Titre | Objectif | Fichiers impactés | Tests | Risques |
|---|-------|----------|-------------------|------|--------|
| B19 | RELIABILITY_SPEC.md | Cadre complet (observability, détection, auto-réparation 3 niveaux) | docs/RELIABILITY_SPEC.md | — | — |
| B20 | RELIABILITY_RUNBOOKS.md | Playbooks (incident perf, cross-tenant risk, billing) | docs/RELIABILITY_RUNBOOKS.md | — | — |
| B21 | REPAIR_JOB_CATALOG.md | Jobs (repair_rebuild_index, repair_reconcile_invoices, etc.) | docs/REPAIR_JOB_CATALOG.md | — | — |
| B22 | GATES_SELF_HEAL.contract.test.ts | Contrats : auto-heal via Write Gateway, audit, pas d’écriture hors tenant | app/src/__tests__/ ou scripts | CI | — |

---

## Ordre d’exécution recommandé (prochaines étapes)

1. **B4** (gate tenant isolation) — rapide, pas de refactor.  
2. **B3** (TENANT_FEATURE_MATRIX branché) — fort impact sur cohérence produit.  
3. **B1** (Write Gateway centralisé) — gros chantier, à découper en sous-tickets par surface (audit, entitlements, tenant, safeMode, storage).  
4. **B2** (Snapshot) — après B1.  
5. **B8, B9, B10, B11** (auto-adapt Phase 2) — après 0.3 et 1.1.  
6. **B19–B22** (reliability docs + gates) — en parallèle ou après B1.

*Backlog alimenté par D1–D4 ; à mettre à jour au fil des livraisons.*
