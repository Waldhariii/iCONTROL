# Release Promote / Rollback Playbook (Phase AL)

## Vue d’ensemble

- **Promote** : passer la release active d’un identifiant `from` à `to` (avec option canary).
- **Rollback** : repasser la release active à un identifiant `to` avec une raison.
- Les deux opérations sont **S2S uniquement** et produisent des rapports + une ligne d’index.

## Endpoints (S2S)

- **POST /api/release/promote**  
  Body : `{ from, to, canary_policy_id?, correlation_id }`  
  Scope requis : `release.*`

- **POST /api/release/rollback**  
  Body : `{ to, reason, correlation_id }`  
  Scope requis : `release.*`

## Rapports et index

- **Promote** :  
  - `runtime/reports/releases/<correlation_id>/PROMOTE_REPORT.json`  
  - `runtime/reports/releases/<correlation_id>/PROMOTE_REPORT.md`
- **Rollback** :  
  - `runtime/reports/releases/<correlation_id>/ROLLBACK_REPORT.json`  
  - `runtime/reports/releases/<correlation_id>/ROLLBACK_REPORT.md`
- **Index** : chaque opération ajoute une ligne dans  
  `runtime/reports/index/releases_latest.jsonl`  
  (champs : `ts`, `action`, `from`, `to`, `correlation_id`, etc.)

## Flux recommandé

1. Compiler les releases cibles (ex. `rel-A`, `rel-B`).
2. S’assurer que la release active (SSOT `changes/active_release.json`) correspond à la baseline.
3. Appeler **POST /api/release/promote** avec `from` = release actuelle, `to` = release cible, et un `correlation_id` unique.
4. Vérifier le rapport dans `runtime/reports/releases/<correlation_id>/` et la nouvelle ligne dans `releases_latest.jsonl`.
5. En cas de problème : appeler **POST /api/release/rollback** avec `to` = release de retour et `reason` ; vérifier `ROLLBACK_REPORT.*` et l’index.

## Gate

- **ReleaseOpsGate** : s’assure que promote/rollback écrivent bien rapports + index + `correlation_id`.
