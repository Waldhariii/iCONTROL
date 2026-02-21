# CORE_SURFACES (LTS) — Périmètre gelé

## Objectif
Stabiliser le Core (LTS) : toute évolution structurelle passe par RFC et validation contract-first.

## Périmètre “Core” (LTS)
Ces zones sont considérées **stables** et **gouvernées** :

- `core-kernel/**`
- `platform-services/**`
- `scripts/gates/**`
- `scripts/release/**`
- `docs/ssot/**`
- `governance/docs/**`
- `docs/architecture/**`

## Hors Core (évolutif)
- `modules/**` (contrats + manifests requis)
- `app/**` (surfaces UI, implémentations adaptatives)
- `_artifacts/**`, `_audit/**` (generated-only)

## Règles LTS
1) Aucune modification structurelle du Core sans RFC approuvé.
2) Toute modification du Core doit être compatible rétro (backward compatible) ou versionnée par contrat.
3) Les sorties générées ne doivent jamais être trackées (`_artifacts/`, `_audit/`).
