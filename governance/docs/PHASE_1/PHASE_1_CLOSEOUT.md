# Phase 1 Closeout — Write Gateway Shadow + SSOT Stabilization

## Objectif (atteint)
- Couche Write Gateway en place (Policy/Audit hooks stub), Safe Mode compatible.
- Pilotes shadow multiples, tous en legacy-first + adapter NO-OP (SKIPPED).
- Flags SSOT OFF par défaut dans `app/src/policies/feature_flags.default.json`.
- Gates report-only pour prioriser la suite:
  - write gateway coverage (heuristique)
  - write surface map (priorisation)
- Normalisation des chemins SSOT (repo-correct) via `gate:ssot:paths` + doc de référence.

## Invariants (non négociables)
1) Le write legacy se fait avant le shadow emit.
2) Le shadow emit est strictement gardé par flag ON/ROLLOUT.
3) L’adapter shadow ne doit jamais réécrire (SKIPPED) en Phase 1.
4) SSR guard pour toute écriture window/localStorage.
5) Proofs doivent rester verts:
   - `npm -s run -S gate:ssot`
   - `npm -s run -S gate:ssot:paths`
   - `npm -s run -S build:cp`
   - `npm -s run -S build:app`

## Hors-scope Phase 1
- Conversion des adapters NO-OP → adapters réels (Phase 2).
- Politique d’écriture bloquante (PolicyHook) et audit durable (AuditHook) non activés.

## Phase 2 (recommandation)
- Sélectionner 2–3 writes à forte valeur (top offenders) pour migration réelle.
- Ajouter idempotency + correlation end-to-end.
- Remplacer localStorage/fs writes par Storage Provider (VFS) tenant-scopé.
