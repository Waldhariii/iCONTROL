# RELIABILITY_SPEC — Reliability & Self-Healing Framework (Enterprise-Grade)

**Objectif:** Le système s’auto-surveille en continu, détecte les anomalies, applique des corrections **automatiques** quand c’est sûr, et bascule en mode "réparation assistée" quand c’est risqué — tout en respectant performance maximale, multi-tenant strict, SAFE_MODE, Write Gateway unique, et stabilité du core gratuit.

**Date:** 2026-01-27.  
**Référence:** Bloc additionnel — Auto-audit régulier + auto-réparation contrôlée.

---

## 1. Principe directeur (Zero-Risk Write)

- Toute auto-correction = opération **gouvernée, idempotente, auditable, rollbackable**.
- Aucun correctif automatique ne doit :
  1. Violer l’isolation multi-tenant.
  2. Modifier des données irréversibles sans snapshot/transaction.
  3. Contourner Write Gateway / policies.
- **SAFE_MODE** peut forcer "suggest-only" (diagnostic + patch proposé) plutôt que "auto-apply".

---

## 2. Surveillances (Observability ++)

### 2.1 Logs structurés + taxonomie d’erreurs

- Format unique logs (JSON) + corrélation : `trace_id`, `tenant_id`, `actor_id`, `module_id`.
- Codes **ERR_*** / **WARN_*** standardisés + classification : SECURITY / DATA / PERF / UX / INTEGRATION.
- Fichiers concernés : `app/src/core/utils/logger.ts`, points d’émission (router, moduleLoader, dashboard, write-gateway, audit).

### 2.2 Métriques & SLO

- Latence p95/p99, taux erreurs, saturation queue, erreurs DB, retries, timeouts.
- SLO par surface : Admin Console vs Tenant App.
- Livrable : **SLO_SLA_METRICS.md** (KPIs, seuils).

### 2.3 Traces distribuées

- Instrumentation : Write Gateway, exports, pipeline OCR/IA (si présent), storage VFS (si présent), scheduler.
- À définir : format (OpenTelemetry ou interne), rétention, sampling (low overhead).

---

## 3. Détection d’anomalies (Proactive Risk Engine)

### 3.1 Règles statiques (déterministes)

- Ex : N erreurs identiques / minute, runaway retries, dead-letter queue, quota overflow, cross-tenant risk signals.
- Implémentation : règles configurables (fichier ou DB) + moteur d’évaluation périodique ou en temps réel (léger).

### 3.2 Détection dynamique (heuristiques)

- Spike d’erreurs, dérive performance, anomalies de consommation (metering), anomalies facturation/compta.
- À définir : seuils, fenêtres, alerting.

### 3.3 Contract Violation Scanner

- Vérifie invariants en prod :
  - `tenant_id` toujours présent.
  - Aucune route active sans entitlement.
  - Aucun write hors Write Gateway.
  - Exports passent Safe Render.
- En cas de violation : **blocage immédiat** + incident + rollback (selon niveau).

---

## 4. Auto-réparation (Self-Heal) — 3 niveaux

### Niveau 1 — AUTO-RECOVERY SÛR (toujours autorisé)

- Restart contrôlé de jobs/schedulers.
- Rebuild index/search.
- Purge caches corrompus.
- Rejouer jobs idempotents depuis queue.
- Basculer en "degraded mode" (features non critiques OFF).
- Circuit breaker sur intégrations externes.
- Auto-rollback sur dernière runtime/configs/manifest validé.

### Niveau 2 — AUTO-FIX GOUVERNÉ (autorisé si règles strictes OK)

- Fix de config non sensible (feature flag toggles) via Control Plane.
- Réparation de données "réversible" uniquement : transactions DB + snapshot avant patch ; corrections de champs invalides détectés par validation.
- Remédiation de permissions "safe" (ex : retirer accès plutôt qu’ajouter).
- Migration corrective uniquement si "forward-only" ET testée (gate).

### Niveau 3 — ASSISTED REPAIR (humain requis)

- Tout ce qui touche : comptabilité/ledger, taxes, paiements ; sécurité (RBAC/SSO), secrets, clés ; suppression de données.
- Le système génère un **Patch Plan** + diff + tests, mais n’applique pas automatiquement.

---

## 5. Architecture "Repairability by Design"

- **Modularity & blast-radius control :** Chaque module = data namespace + feature flags + quotas + logs dédiés ; dépendances minimales, communication via events/ports.
- **Safe rollback & snapshots :** Snapshots périodiques (DB + storage metadata) + restore drill ; release manifest versionné, rollback en 1 commande.
- **Runbooks intégrés :** Playbooks standards (incident perf, cross-tenant risk, OCR, billing) — voir **RELIABILITY_RUNBOOKS.md**.
- **Repair jobs catalogue :** Jobs versionnés (repair_rebuild_index, repair_reconcile_invoices, etc.) — voir **REPAIR_JOB_CATALOG.md**. Chaque job : dry-run, apply, rollback, audit.

---

## 6. Contrôle via Console Admin (Control Plane)

- **Reliability Center :** État santé global + par tenant + par module ; incidents + timeline + root cause hints ; actions : restart job, rebuild index, degrade mode, rollback release ; mode support audité (impersonation contrôlée).
- **Safety Switches :** SAFE_MODE global/tenant/module ; auto-heal enabled/disabled par catégorie (DATA/PERF/SECURITY) ; thresholds configurables.

---

## 7. Gates & tests (anti-régression obligatoire)

- **Tests contractuels Self-Heal :** Toute action auto-heal passe par Write Gateway (ou canal ops signé) ; toute action produit audit log + trace_id ; aucune action ne peut écrire hors namespace tenant ; rollback fonctionne (simulation). Livrable : **GATES_SELF_HEAL.contract.test.ts** (ou équivalent).
- **Chaos testing contrôlé (staging) :** Pannes storage, queue, DB latence, intégrations down ; le système doit revenir "OK" sans corruption.

---

## 8. Politique "Performance First"

- Auto-audit régulier = **low overhead** : sampling traces, scans incrémentaux, fenêtres planifiées pour jobs lourds.
- Séparer "realtime signals" vs "batch audits" (quotidien/hebdo).

---

## 9. Livrables associés

| Livrable | Description |
|----------|-------------|
| **RELIABILITY_SPEC.md** | Ce document. |
| **RELIABILITY_RUNBOOKS.md** | Playbooks (incident perf, cross-tenant risk, OCR, billing). |
| **REPAIR_JOB_CATALOG.md** | Jobs + invariants (dry-run, apply, rollback, audit). |
| **SLO_SLA_METRICS.md** | KPIs, seuils, SLO par surface. |
| **GATES_SELF_HEAL.contract.test.ts** | Contrats bloquants (Write Gateway, audit, tenant, rollback). |
| Incident templates | Postmortem + actions. |

---

## 10. Acceptance criteria (Definition of Done)

- Détection + auto-recovery niveau 1 opérationnels.
- Niveau 2 seulement si snapshot + rollback + audit.
- Niveau 3 = patch plan seulement.
- Aucun impact cross-tenant possible (tests).
- Dégradation contrôlée (features OFF) sans crash.
- Console admin expose les actions + audit complet.
