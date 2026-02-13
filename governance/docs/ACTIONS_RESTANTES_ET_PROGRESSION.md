# Actions restantes à 100 % + temps nécessaire + progression actuelle

**Date:** 2026-01-27.  
**Source:** D1–D5, GAP_MATRIX, EXECUTION_ROADMAP_AZ, Blocs 1–3 (système cible A→Z, Mandat enterprise-grade++, Reliability).

---

## A. Approximation de la progression actuelle du système

| Domaine | Poids estimé | État actuel | % réalisé du domaine | Contribution au total |
|---------|--------------|-------------|----------------------|------------------------|
| **Fondations (repo, build, routing, tests, gates)** | 12 % | En place (Vite, router, ROUTE_CATALOG, Vitest, gate:ssot, design tokens) | ~85 % | ~10 % |
| **Core Kernel & Gouvernance** | 15 % | SAFE_MODE, RBAC partiel, Write Gateway partiel, storageNs, audit partiel | ~35 % | ~5 % |
| **Console Admin (Control Plane)** | 18 % | Tenants, subscription, audit, pages CP partielles ; pas Security/Storage/Support | ~25 % | ~4,5 % |
| **Modules / Auto-adapt** | 8 % | Manifests partiels, pas d’auto-discovery, registries manuels | ~20 % | ~1,5 % |
| **IA / OCR / Automation** | 8 % | Absent | 0 % | 0 % |
| **Reliability & Self-Healing** | 4 % | Docs + GATES_SELF_HEAL test ; pas de runtime (observability, auto-réparation) | ~15 % | ~0,5 % |
| **Sécurité avancée / VFS / Observabilité** | 5 % | Auth locale, pas VFS, pas métriques/SLO | ~10 % | ~0,5 % |
| **UX / Design system** | 5 % | Tokens centralisés, thèmes partiels, audits UI | ~65 % | ~3 % |

**Progression globale estimée du système : ~28 %**  
(fourchette raisonnable : **25–30 %** selon ce qui est compté comme “système complet” — ici aligné sur la cible Bloc #1.)

---

## B. Temps nécessaire pour compléter tout le système (approximation)

Estimation en **personnes-jours (j)** puis conversion en **mois** (1 personne à temps plein ≈ 20 j/mois).  
Sizing : S ≈ 0,5–1 j, M ≈ 1–2 j, L ≈ 3–5 j, XL ≈ 8–15 j.

| Phase | Actions | Sizing agrégé | Fourchette (j) |
|-------|---------|----------------|----------------|
| **Phase 0** | 0.2 Valider invariants ; 0.3 SSOT module registry document | S + M | 1–3 |
| **Phase 1** | 1.1 Entitlement Resolver ; 1.2 RBAC/SAFE_MODE tenant/module ; 1.3 Write Gateway strict ; 1.4 Safe Render export ; 1.5 Gates (tenant isolation, write-gateway 100 %) | M + L + L + M + M | 18–28 |
| **Phase 2** | 2.1 Manifeste ; 2.2 Auto-discovery ; 2.3 Lint + gates ; 2.4 Release manifest ; 2.5 Doc “ajouter une page” | M + L + M + S + S | 10–16 |
| **Phase 3** | 3.1 Tenants complet ; 3.2 Subscriptions portail ; 3.3 Security center ; 3.4 Storage/VFS ; 3.5 Compliance & Audit ; 3.6 Ops & Reliability Center | L + L + XL + XL + M + L | 45–75 |
| **Phase 4** | 4.1 CRM ; 4.2 DMS ; 4.3 Work Orders ; 4.4 Calendrier/Dispatch ; 4.5 Facturation ; 4.6 Compta ; 4.7 Analytics ; 4.8 Achats/Inventaire ; 4.9 Intégrations | XL×5 + L×4 | 80–130 |
| **Phase 5** | 5.1 Pipeline OCR + human-in-the-loop ; 5.2 Auto-entry SAFE_MODE ; 5.3 Anomalies ; 5.4 Traçabilité IA | XL + L + M + M | 22–38 |
| **Phase 6** | 6.1 Observabilité/SLO ; 6.2 Perf/cache/queue ; 6.3 Sécurité avancée ; 6.4 Playbooks/canary ; 6.5 Doc produit | L + L + L + M + M | 22–32 |
| **Reliability (Bloc 3)** | Détection, 3 niveaux auto-réparation, Reliability Center, repair jobs, SLO, chaos tests | — | 25–45 |
| **Buffer (régression, intégration, revues)** | 15–20 % du total | — | 35–55 |

**Total estimé : ~258–422 personnes-jours**  
**En mois (1 dev full-time) : ~13–21 mois.**  
**En mois (2 devs) : ~7–11 mois.**

*Ceci est une approximation basée sur la complexité des livrables (S/M/L/XL) et l’audit du code ; ce n’est pas un engagement contractuel. Les facteurs réels (découvertes, dépendances, priorités) peuvent faire varier la durée.*

---

## C. Liste exhaustive des actions restantes (à 10000 %)

Chaque ligne = une action concrète à faire pour atteindre le système complet (Blocs 1–3).  
Numérotation cohérente avec D3/D5 ; ordre recommandé = Phase puis priorité.

---

### PHASE 0 — BASELINE & PROOF

| # | Action | Critère de complétion |
|---|--------|------------------------|
| 0.1 | ~~Générer D1/D2~~ | FAIT (docs livrés) |
| 0.2 | Valider invariants existants : npm test + gate:ssot passent, pas de régression | Tous les tests et gates SSOT verts |
| 0.3 | Rédiger document SSOT “module registry + état actuel des pages” (liste pages, module_id, route_id, branché/stub/absent) | Document unique à jour dans docs/ |

---

### PHASE 1 — GOVERNANCE KERNEL HARDENING

| # | Action | Critère de complétion |
|---|--------|------------------------|
| 1.1 | Brancher TENANT_FEATURE_MATRIX dans entitlements/resolve() ; chaque page a entitlement OFF/VIEW/ACTIVE | resolve() filtre par plan ; tests |
| 1.2 | Brancher guard de navigation sur enabled_pages (plan tenant) ; page non autorisée → redirect ou access-denied | Router/moduleLoader + guard utilisent matrix |
| 1.3 | Étendre RBAC : policies chargées depuis config, scopes, ABAC si besoin | Policies par rôle/module, tests |
| 1.4 | SAFE_MODE lisible par tenant et par module (config + runtime) | Config safe-mode par tenant/module ; isSafeMode(tenant?, module?) |
| 1.5 | Centraliser toutes les écritures dans Write Gateway (auditLog, entitlements/storage, tenant, safeMode, control-plane/storage, themeManager, localAuth, etc.) | Aucun localStorage.setItem / saveEntitlements direct hors gateway ; gate 100 % |
| 1.6 | Implémenter snapshot avant mutation pour cibles critiques (matrice tenant, config safe-mode, brand, module-registry, entitlements) | Snapshot + rollback documenté ; tests |
| 1.7 | Moteur d’export PDF/CSV/JSON centralisé avec filtre par autorisations (tenant, rôle) | Un seul point d’export ; Safe Render ; tests |
| 1.8 | Garantir audit trail append-only et structure invariants (taille, format) | Audit *.contract.test + doc invariants |
| 1.9 | Créer gate “tenant isolation” : tests contractuels (route avec tenant context, aucun write sans tenant_id) + CI | Fichier tenant-isolation.contract.test.ts ; gate dans CI |
| 1.10 | Étendre gate write-gateway-coverage à 100 % des surfaces d’écriture | CI bloque si écriture hors gateway |
| 1.11 | Taxonomie centralisée des codes ERR_* / WARN_* (SECURITY, DATA, PERF, UX, INTEGRATION) | Fichier ou doc + usage dans logger/émetteurs |

---

### PHASE 2 — AUTO-ADAPT SYSTEM

| # | Action | Critère de complétion |
|---|--------|------------------------|
| 2.1 | Convention manifeste module : champs id, routes, entitlements_default (OFF/VIEW/ACTIVE), data_namespace, tests_contractuels ; aligner _module-template et core-system | Manifests à jour ; doc AUTO_ADAPT_SYSTEM_SPEC |
| 2.2 | Script auto-discovery : scan modules/**/manifest → registry modules, routing table, nav, permission matrix, entitlements catalog | Script Node ; sortie runtime/configs/ssot ou artefact généré |
| 2.3 | Gate “drift” : comparer sortie auto-discovery vs ROUTE_CATALOG / TENANT_FEATURE_MATRIX (ou générer et commiter) | CI ou PR vérifie cohérence |
| 2.4 | Adapter moduleLoader (ou registries) pour utiliser registry généré (dispatcher par route_id) | Plus de chaîne if/else manuelle par route ; un seul point d’enregistrement |
| 2.5 | Gate “module completeness” : pour chaque route exposée, manifest valide + au moins un test (ou exclusion documentée) | scripts/gates/gate-module-completeness.mjs ; CI |
| 2.6 | Lint / gate “style system” : aucun nouveau CSS global non autorisé ; tokens obligatoires | Règles ESLint ou script ; gate:ui-drift renforcé |
| 2.7 | Release manifest versionné ; rollback en 1 commande documenté | RUNBOOK_ROLLBACK à jour ; commande testée |
| 2.8 | Rédiger doc unique “Comment ajouter une page métier” (étapes, manifest, discovery, gate, validation) | docs/ ; procédure < 5 min |

---

### PHASE 3 — CONSOLE ADMIN (Control Plane) COMPLETE

| # | Action | Critère de complétion |
|---|--------|------------------------|
| 3.2 | Tenant : import/export tenant (migration) | Flux export/import documenté et testé |
| 3.3 | Subscriptions : portail plans/add-ons, viewer entitlements par tenant, metering (consommation quotas) | pages/cp/subscription.ts + modules/core-system/subscription |
| 3.4 | Subscriptions : facturation plateforme (invoices, paiements, taxes, dunning) — au moins stub ou MVP | Données + UI minimales |
| 3.5 | Module Catalog : catalogue pages activables/désactivables par plan ; rollout contrôlé (canary si besoin) | UI + branchement TENANT_FEATURE_MATRIX |
| 3.6 | Security Center : policies (password, sessions, devices, IP allowlist), MFA/SSO stub ou intégré, threat signals (anomalies login) | Nouveau module ou pages CP |
| 3.7 | Security Center : DLP/PII scanning (si premium) ; gestion clés (KMS), rotation | Optionnel premium |
| 3.8 | Storage & Data Governance : abstraction VFS (local / cloud / hybride), choix storage par tenant | platform-services ou module dédié |
| 3.9 | Storage : lifecycle (hot/warm/cold), archivage, purge ; backups, snapshots, restore test | Config + jobs ou manuels |
| 3.10 | Compliance & Audit : audit logs consultables/exportables (CSV/JSON), tamper-proof si requis | pages/cp/audit.ts + auditLog |
| 3.11 | Ops & Reliability : Reliability Center (état santé, incidents, timeline, actions : restart job, rebuild index, degrade mode, rollback) | UI Console Admin + backend ou adapters |
| 3.12 | Ops : Safety Switches (SAFE_MODE global/tenant/module, auto-heal par catégorie, thresholds) | Config + UI |
| 3.13 | Support : impersonation contrôlée (support mode) + audit ; playbooks, tickets | Module ou intégration |

---

### PHASE 4 — APP CLIENT (ERP PME)

| # | Action | Critère de complétion |
|---|--------|------------------------|
| 4.1 | CRM : module + routes (leads, opportunités, clients, pipeline, contacts, org, historique interactions) | Module CRM ; ROUTE_CATALOG ; moduleLoader |
| 4.2 | CRM : devis/estimations, propositions, e-signature (stub ou intégré) | Selon priorité |
| 4.3 | CRM : segmentation, campagnes (email/SMS), modèles ; table Excel-like (filtres, colonnes) | MVP puis enrichissement |
| 4.4 | DMS : module + routes ; ingestion (upload, scan, email-in, API), tags, métadonnées | Module documents ; route #/docs |
| 4.5 | DMS : recherche plein texte + index ; versioning, approbations, verrouillage | Backend ou adapter |
| 4.6 | DMS : workflows (validation facture, demandes achat/dépenses), alertes échéances | Optionnel |
| 4.7 | Work Orders / Jobs : module + routes ; ordres de travail, checklists, photos, signatures, matériaux, temps | Module jobs ; UI complète |
| 4.8 | Work Orders : modes offline mobile + synchro (stub ou réel) | Selon priorité |
| 4.9 | Calendrier techniciens : module + routes ; vues jour/semaine/mois, affectation, disponibilités, congés | Module calendar |
| 4.10 | Calendrier : notifications client (rappel, arrivée, suivi) ; optimisation routes / ETA (premium) | Optionnel |
| 4.11 | Facturation : module + routes ; chaîne devis → bon de travail → facture ; génération auto (temps, matériaux, forfaits) | Module billing/invoicing |
| 4.12 | Facturation : paiements (portail client), relances (dunning) | UI + règles |
| 4.13 | Comptabilité : core gratuit (revenus/dépenses, catégories, exports, taxes de base) | Module compta |
| 4.14 | Comptabilité : premium (grand livre, écritures, rapprochement bancaire, multi-taxes, budgets, P&L) | Optionnel |
| 4.15 | Achats / Inventaire / Fournisseurs : fournisseurs, commandes, réception, inventaire (articles, lots, minimums) | Module inventory |
| 4.16 | Achats : liaison jobs ↔ matériaux consommés | Intégration |
| 4.17 | RH / Temps : timesheets techniciens, approbations, coûts main-d’œuvre (optionnel) | Module ou section |
| 4.18 | Analytics : dashboards configurables (CA, jobs planifiés vs complétés, conversion, rentabilité) | Enrichir dashboard + widgets |
| 4.19 | Analytics : KPI engine + widgets modulaires ; exports PDF/CSV (Safe Render) | Moteur export Phase 1.7 |
| 4.20 | Intégrations : connecteurs (email, calendrier, e-signature, banque, stockage cloud, webhooks/API) | modules ou adapters |

---

### PHASE 5 — IA/OCR & AUTOMATION

| # | Action | Critère de complétion |
|---|--------|------------------------|
| 5.1 | Pipeline OCR : ingestion → pré-traitement → OCR → extraction → validation ; human-in-the-loop (seuil confiance, file révision) | Module ou service OCR |
| 5.2 | OCR : classement automatique docs (factures, reçus, contrats, etc.) ; extraction champs (vendor, date, total, taxes) | Règles d’assignation |
| 5.3 | Auto-entry contrôlé : écritures IA via Write Gateway ; SAFE_MODE suggest-only ou write contrôlé | Intégration 1.5 + 5.1 |
| 5.4 | Détection anomalies + suggestions (facture/bon, doublons, erreurs) | Règles + UI |
| 5.5 | Traçabilité IA : logs input hash, version modèle, paramètres, sorties ; redaction PII si activé | Audit + structure |

---

### PHASE 6 — INDUSTRIALISATION (Enterprise++)

| # | Action | Critère de complétion |
|---|--------|------------------------|
| 6.1 | Observabilité : logs structurés (JSON, trace_id, tenant_id), métriques (latence p95/p99, taux erreurs, saturation), SLO par surface (CP, APP) | Instrumentation + SLO_SLA_METRICS |
| 6.2 | Traces distribuées : Write Gateway, exports, OCR, VFS, scheduler (sampling low overhead) | Format (OpenTelemetry ou interne) |
| 6.3 | Perf : cache, queue, index (recherche) ; tests de charge | Stratégie + implémentation |
| 6.4 | Sécurité avancée premium : DLP, scans PII, politiques export, segmentation réseau, clés par tenant | Optionnel |
| 6.5 | Migration/upgrade playbooks ; canary rollout ; rollback en 1 commande | docs/runbooks ; processus |
| 6.6 | Documentation produit + runbooks support | docs/ |

---

### RELIABILITY & SELF-HEALING (Bloc 3)

| # | Action | Critère de complétion |
|---|--------|------------------------|
| R.1 | Détection : règles statiques (N erreurs/min, runaway retries, dead-letter queue, quota overflow, cross-tenant signals) | Moteur règles + config |
| R.2 | Détection : heuristiques (spike erreurs, dérive perf, anomalies metering/facturation) | Seuils + alerting |
| R.3 | Contract Violation Scanner : tenant_id présent, route avec entitlement, aucun write hors Write Gateway, exports Safe Render | Script ou service ; blocage + incident |
| R.4 | Auto-recovery Niveau 1 : restart jobs/schedulers, rebuild index, purge caches, rejouer jobs idempotents, degraded mode, circuit breaker, auto-rollback config | Implémentation des actions |
| R.5 | Auto-fix Niveau 2 : fix config non sensible (toggles), réparation données réversible (snapshot + patch), remédiation permissions “safe”, migration forward-only | Gouverné par snapshot + audit |
| R.6 | Assisted Repair Niveau 3 : génération Patch Plan + diff + tests pour compta/sécurité/suppression ; pas d’auto-apply | Génération de rapports/plans |
| R.7 | Repair jobs : repair_rebuild_index, repair_reconcile_invoices, repair_reprocess_ocr_batch, repair_fix_orphan_files_vfs, repair_policy_recompute_entitlements, etc. (dry-run, apply, rollback, audit) | Catalogue REPAIR_JOB_CATALOG implémenté |
| R.8 | Reliability Center dans Console Admin : santé globale/tenant/module, incidents, timeline, actions (restart, rebuild, degrade, rollback), mode support audité | UI Phase 3.11 |
| R.9 | Chaos testing contrôlé (staging) : pannes storage, queue, DB, intégrations ; système revient OK sans corruption | Scénarios + runbooks |
| R.10 | Politique “Performance First” : sampling traces, scans incrémentaux, fenêtres planifiées ; realtime vs batch | Config + doc |

---

### QUALITÉ / ANTI-RÉGRESSION (transversal)

| # | Action | Critère de complétion |
|---|--------|------------------------|
| Q.1 | PAGE_BOUNDARY_LINT : renforcer interdiction page→page ; lint ou gate | ESLint ou scripts/gates |
| Q.2 | Thèmes Admin vs Client strictement isolés (cloisonnement par surface) | Presets + usage dans shell/layout |
| Q.3 | Migration styles legacy vers tokens (réduire couleurs en dur) ; gate:ui-drift | Audits UI existants |
| Q.4 | Catalogue UI / snapshots en CI (détection régressions visuelles) | ui-catalog-snap, cp-visual-snap dans CI |
| Q.5 | Auth : renforcer rate limiting, sessions, durée de vie | localAuth, platform-services/security |
| Q.6 | Chiffrement au repos/en transit : spécifier périmètre et implémenter si requis | Doc + implémentation |

---

## D. Synthèse des comptages

| Catégorie | Nombre d’actions restantes |
|-----------|----------------------------|
| Phase 0 | 2 (0.1 fait) |
| Phase 1 | 11 |
| Phase 2 | 8 |
| Phase 3 | 13 |
| Phase 4 | 20 |
| Phase 5 | 5 |
| Phase 6 | 6 |
| Reliability (Bloc 3) | 10 |
| Qualité / transversal | 6 |
| **Total** | **~81 actions** |

*(Certaines actions sont décomposables en sous-tâches ; le chiffre reflète les blocs actionnables tels que définis dans la roadmap et le backlog.)*

---

## E. Ordre d’exécution recommandé (résumé)

1. **Phase 0** : 0.2, 0.3  
2. **Phase 1** (priorité sécurité/isolation) : 1.9 (gate tenant isolation) → 1.1–1.2 (TENANT_FEATURE_MATRIX) → 1.5–1.6 (Write Gateway + snapshot) → 1.3–1.4, 1.7–1.11  
3. **Phase 2** : 2.1 → 2.2–2.4 → 2.5–2.8  
4. **Phase 3** : 3.1–3.5 → 3.6–3.9 → 3.10–3.13  
5. **Phase 4** : 4.1–4.4 (CRM, DMS, Jobs, Calendrier) → 4.5–4.14 (Facturation, Compta) → 4.15–4.20  
6. **Phase 5** : 5.1–5.5  
7. **Phase 6** : 6.1–6.6  
8. **Reliability** : R.1–R.10 (en parallèle ou après Phase 1–3 selon ressources)  
9. **Qualité** : Q.1–Q.6 (continu)

---

*Document de référence pour le suivi de la complétion du système. À mettre à jour au fil des livraisons.*
