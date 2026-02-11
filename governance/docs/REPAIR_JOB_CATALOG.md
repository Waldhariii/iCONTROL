# REPAIR_JOB_CATALOG — Jobs de réparation (Enterprise-Grade)

**Objectif:** Catalogue des jobs de réparation versionnés. Chaque job : dry-run, apply, rollback, audit. Aligné avec RELIABILITY_SPEC (Niveau 1 et 2).

**Date:** 2026-01-27.

---

## Convention par job

- **id** : identifiant stable (ex. `repair_rebuild_index`).
- **version** : semver du job.
- **niveau** : 1 (auto-recovery sûr) ou 2 (auto-fix gouverné).
- **dry-run** : exécution sans écriture ; rapport des changements proposés.
- **apply** : exécution réelle ; snapshot avant si Niveau 2.
- **rollback** : restauration depuis snapshot si disponible.
- **audit** : toute exécution (dry-run, apply, rollback) enregistrée avec trace_id, tenant_id, résultat.

---

## Jobs proposés (cible)

| Job id | Description | Niveau | Préconditions | Rollback |
|--------|-------------|--------|---------------|----------|
| **repair_rebuild_index** | Rebuild index/search (docs, CRM, jobs, ledger). | 1 | Aucune écriture métier ; idempotent. | N/A (recréation) |
| **repair_reconcile_invoices** | Rapprochement factures / paiements (anomalies détectées). | 2 | Snapshot avant ; réversible. | Snapshot |
| **repair_reprocess_ocr_batch** | Retraiter un lot OCR (file révision ou échecs). | 2 | Snapshot ou file dédiée ; idempotent par batch_id. | Snapshot / file |
| **repair_fix_orphan_files_vfs** | Corriger fichiers orphelins (VFS) ou métadonnées incohérentes. | 2 | Snapshot VFS metadata ; dry-run obligatoire. | Snapshot |
| **repair_policy_recompute_entitlements** | Recalculer entitlements par tenant (cache ou dérivés). | 2 | Snapshot entitlements ; pas de modification abonnements. | Snapshot |
| **repair_purge_corrupt_cache** | Purge caches corrompus (identifiés par checksum ou erreur). | 1 | Pas de donnée persistante critique en cache. | N/A |
| **repair_restart_scheduler** | Restart contrôlé d’un scheduler (sans perte de jobs en queue). | 1 | Queue persistante ou rejouable. | N/A |
| **repair_rollback_release** | Rollback vers dernière release validée (manifest + config). | 1 | Manifest versionné ; config snapshot disponible. | N/A (est lui-même rollback) |

---

## Invariants (obligatoires)

- Aucun job ne doit écrire hors **namespace tenant** (tenant_id obligatoire).
- Toute écriture passe par **Write Gateway** (ou canal ops signé avec audit).
- **Niveau 2** : snapshot avant apply ; rollback testé.
- **Niveau 3** (assisted repair) : pas de job automatique ; uniquement Patch Plan généré.

---

## Intégration Console Admin

- Reliability Center : liste des jobs disponibles ; exécution dry-run / apply (avec confirmation pour Niveau 2) ; historique des exécutions (audit).
- Safety Switches : désactiver certains jobs par tenant ou par catégorie (DATA/PERF/SECURITY).

---

## État actuel (audit 2026-01-27)

- Aucun job de réparation implémenté dans le repo. Ce catalogue sert de **spécification** pour les livrables Phase 6 et Bloc 3 (Reliability).
- Les scripts existants (`scripts/audit/*`, `scripts/maintenance/*`) sont des **audits** ou **maintenance manuelle**, pas des repair jobs gouvernés avec dry-run/apply/rollback/audit.

---

*Catalogue à faire évoluer avec l’implémentation des jobs et les retours d’incidents.*
