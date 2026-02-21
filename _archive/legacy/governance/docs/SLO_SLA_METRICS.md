# SLO_SLA_METRICS — KPIs et SLO (Enterprise-Grade)

**Objectif:** Définir les métriques, seuils et SLO par surface (Admin Console vs Tenant App) pour le cadre Reliability & Self-Healing.

**Date:** 2026-01-27.  
**Référence:** RELIABILITY_SPEC § 2.2.

---

## 1. Métriques cibles (à instrumenter)

| Métrique | Description | Surface |
|----------|-------------|---------|
| **Latence p95 / p99** | Temps de réponse des pages / API (ms). | CP, APP |
| **Taux d’erreurs** | % requêtes en erreur (4xx/5xx ou erreurs métier). | CP, APP |
| **Saturation queue** | Taille / délai des queues (jobs, OCR, notifications). | Backend / futur |
| **Erreurs DB** | Nombre d’erreurs DB par fenêtre. | Backend / futur |
| **Retries** | Nombre de retries (API, intégrations). | CP, APP |
| **Timeouts** | Nombre de timeouts par service. | CP, APP |
| **Erreurs par code** | Comptage ERR_* / WARN_* par code (SECURITY, DATA, PERF, UX). | CP, APP |

---

## 2. SLO par surface (exemples — à valider)

| Surface | SLO latence (p95) | SLO disponibilité | SLO taux erreurs |
|---------|--------------------|-------------------|------------------|
| **Console Admin (CP)** | &lt; 2 s (page load) | 99,5 % | &lt; 0,5 % |
| **Tenant App (APP)** | &lt; 1,5 s (page load) | 99,5 % | &lt; 0,5 % |
| **API runtime / config** | &lt; 500 ms | 99,9 % | &lt; 0,1 % |

---

## 3. Seuils alerting (exemples)

- **Warning :** p95 &gt; 1,5× SLO ; taux erreurs &gt; 0,3 %.
- **Critical :** p95 &gt; 2× SLO ; taux erreurs &gt; 1 % ; saturation queue &gt; seuil.
- **Cross-tenant / sécurité :** toute détection = Critical + blocage selon RELIABILITY_RUNBOOKS.

---

## 4. Politique "Performance First"

- **Sampling traces :** pour limiter le coût, échantillonnage des traces (ex. 1 % ou par tenant).
- **Scans incrémentaux :** audits batch (quotidiens/hebdo) en fenêtre planifiée.
- **Realtime vs batch :** signaux temps réel (latence, erreurs) vs audits batch (contract violation, métriques agrégées).

---

## 5. État actuel (audit 2026-01-27)

- Aucune métrique ni SLO instrumentés dans le repo (application client-side, pas de backend métriques).
- Ce document sert de **spécification** pour Phase 6 (Observabilité) et l’implémentation du Reliability Center.
- Lors de l’ajout d’un backend ou d’un service d’observabilité : intégrer ces KPIs et seuils, et les exposer dans la Console Admin.

---

*Document à faire évoluer avec l’implémentation des métriques et les accords SLA avec les parties prenantes.*
