# Workflow execute — security playbook (Phase AH)

Playbook pour vérifier et opérer la sécurité de l’exécution des workflows (freeze, SAFE_MODE, chemins, quotas).

## Freeze

- Quand **Change Freeze** est actif et `scopes.content_mutations` est true, l’API refuse l’exécution (`mode=execute`) avec **423** et `code: "freeze"`.
- Vérification : `GET /api/studio/freeze` → `enabled`, `scopes` ; puis `POST /api/studio/workflows/run` avec `mode=execute` → doit retourner 423 si freeze + content_mutations.

## SAFE_MODE

- En mettant `SAFE_MODE=1` dans l’environnement du serveur, seuls les kinds allowlistés peuvent s’exécuter en mode execute.
- `accounting.sync` est refusé (step failed, pas d’appel externe).

## Chemins et quotas

- Tous les artefacts doivent rester sous `runtime/artifacts/<correlation_id>/` (pas de `../`).
- Storage adapter : quota soft par artefact (ex. 10 MB) ; dépassement → erreur.

## Journalisation

- Workflows : `runtime/reports/index/workflows_latest.jsonl`.
- Notify : `runtime/reports/index/notify_latest.jsonl`.
- Accounting (sync draft) : `runtime/reports/index/billing_drafts.jsonl`.

## Tests de non-régression

- `node scripts/ci/test-workflow-execute-localfs.mjs` : PDF local + RUN_REPORT + index.
- `node scripts/ci/test-execute-freeze-blocks.mjs` : freeze → 423.

## Voir aussi

- `docs/architecture/ADAPTERS_HARDENING_V1.md`
