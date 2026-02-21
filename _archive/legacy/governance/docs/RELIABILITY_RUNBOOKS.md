# RELIABILITY_RUNBOOKS — Playbooks incidents (Enterprise-Grade)

**Objectif:** Playbooks standards pour incidents (perf, cross-tenant risk, OCR, billing). À utiliser avec le Reliability Center (Console Admin) et le cadre RELIABILITY_SPEC.

**Date:** 2026-01-27.

---

## 1. Incident Perf (dégradation latence / saturation)

### Détection

- SLO latence p95/p99 dépassés ; taux erreurs en hausse ; saturation queue ou CPU.

### Actions immédiates (Niveau 1)

1. Vérifier métriques par tenant et par module (identifier blast radius).
2. Activer **degraded mode** si nécessaire (features non critiques OFF).
3. Circuit breaker sur intégrations externes si source identifiée.
4. Purge caches corrompus ou surchargés (si politique le permet).
5. Restart contrôlé des jobs/schedulers concernés (un par un, avec audit).

### Actions gouvernées (Niveau 2)

- Ajuster feature flags (toggles) via Control Plane après snapshot.
- Rebuild index/search en fenêtre planifiée.

### Escalade (Niveau 3)

- Si modification données ou config sensible : générer Patch Plan, pas d’auto-apply. Humain valide et applique avec rollback possible.

### Postmortem

- Documenter : timeline, root cause, actions prises, mesures de prévention.
- Mettre à jour seuils SLO/alerting si besoin.

---

## 2. Incident Cross-Tenant Risk

### Détection

- Contract Violation Scanner : requête ou write sans tenant_id ; accès à des données d’un autre tenant.
- Logs : ERR_* ou WARN_* avec classification SECURITY.

### Actions immédiates (Niveau 1)

1. **Blocage immédiat** : désactiver la fonctionnalité ou le module concerné (degraded mode).
2. Isoler le tenant concerné si possible (sans couper les autres).
3. Générer incident + audit trail (qui, quand, quoi).
4. Pas d’auto-fix sur les données : Niveau 3.

### Actions gouvernées (Niveau 2)

- Aucune auto-réparation sur les données cross-tenant. Remédiation "safe" uniquement (ex : révoquer un accès) après revue sécurité.

### Escalade (Niveau 3)

- Patch Plan obligatoire ; revue sécurité ; correction manuelle avec snapshot avant/après ; tests de non-régression isolation.

### Postmortem

- Vérifier invariants (tenant_id partout, namespaces, tests contractuels). Renforcer gates (tenant isolation).

---

## 3. Incident OCR / Pipeline IA

### Détection

- Taux d’échec OCR en hausse ; queue de révision saturée ; erreurs de modèle ou de version.

### Actions immédiates (Niveau 1)

1. Circuit breaker sur pipeline OCR (pause ingestion si nécessaire).
2. Rejouer jobs idempotents depuis queue (avec limite pour éviter boucle).
3. Basculer en mode "human-in-the-loop" uniquement (pas d’auto-entry) si SAFE_MODE le permet.

### Actions gouvernées (Niveau 2)

- Repair job : repair_reprocess_ocr_batch (dry-run puis apply, avec snapshot).
- Aucune modification des écritures comptables ou ledger sans Niveau 3.

### Escalade (Niveau 3)

- Tout correctif sur données extraites ou écrites (factures, compta) = Patch Plan + humain.

### Postmortem

- Vérifier traçabilité IA (version modèle, hashes, audit). Ajuster seuils de confiance ou règles d’assignation.

---

## 4. Incident Billing / Facturation

### Détection

- Anomalies metering, quotas dépassés sans cohérence ; erreurs facturation ; dunning en échec.

### Actions immédiates (Niveau 1)

1. Ne pas modifier les écritures facturation/compta automatiquement.
2. Dégraded mode : désactiver facturation automatique ou relances si risque.
3. Alerting + création incident.

### Actions gouvernées (Niveau 2)

- Aucun auto-fix sur ledger, taxes, paiements. Uniquement toggles ou config non sensible (ex : désactiver relance auto).

### Escalade (Niveau 3)

- Toute correction facturation/compta = Patch Plan + validation humaine + snapshot + rollback possible.

### Postmortem

- Vérifier cohérence données, droits, audit. Renforcer contrats Write Gateway pour écritures compta.

---

## 5. Checklist post-repair (gates)

Après toute réparation (Niveau 1 ou 2) :

- [ ] Audit log vérifié (trace_id, tenant_id, action).
- [ ] Aucun write hors Write Gateway.
- [ ] Rollback testé (simulation ou réel si Niveau 2).
- [ ] SLO / métriques revenus dans les seuils (si incident perf).
- [ ] Postmortem rédigé et partagé.

---

*Runbooks à intégrer dans la Console Admin (Reliability Center) et à faire évoluer selon les retours d’incidents.*
