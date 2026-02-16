# Workflow dry-run playbook (Phase AE)

Exécuter les workflows BizDocs en mode dry-run via l’Action Bus, avec audit et `correlation_id`.

## Prérequis

- API démarrée : `pnpm api:dev` ou `node apps/backend-api/server.mjs` (CI : `CI=true HOST=127.0.0.1 PORT=0`).
- `workflow_id` présent dans `platform/ssot/studio/workflows/workflow_definitions.json`.

## Endpoint

- **POST** `/api/studio/workflows/run`
- Body JSON : `{ "workflow_id": "workflow:...", "mode": "dry_run", "inputs": {} }`
- Headers : `Content-Type: application/json`, optionnel `x-request-id` (sinon un UUID est généré et renvoyé en `correlation_id`).

## Exemples curl

```bash
# dry_run (défaut)
curl -s -X POST http://127.0.0.1:7070/api/studio/workflows/run \
  -H "Content-Type: application/json" \
  -d '{"workflow_id":"workflow:accounting_sync_run","mode":"dry_run"}'

# avec x-request-id pour tracer
curl -s -X POST http://127.0.0.1:7070/api/studio/workflows/run \
  -H "Content-Type: application/json" \
  -H "x-request-id: my-trace-001" \
  -d '{"workflow_id":"workflow:pdf_export_invoice","mode":"dry_run"}'
```

## Réponse attendue (200)

```json
{
  "ok": true,
  "workflow_id": "workflow:accounting_sync_run",
  "mode": "dry_run",
  "steps": [
    { "step_id": "validate", "status": "ok" },
    { "step_id": "execute_stub", "status": "ok", "correlation_id": "...", "actor": "system" }
  ],
  "artifacts": [{ "artifact_id": "dryrun:workflow:...", "kind": "audit_log" }],
  "correlation_id": "<x-request-id ou UUID>"
}
```

- En dry_run, aucun I/O externe ; les `steps` et `artifacts` sont des stubs pour audit.

## Où sont écrits les logs / index

- **Index des runs** : `runtime/reports/index/workflows_latest.jsonl`  
  Une ligne JSON par exécution : `ts`, `correlation_id`, `workflow_id`, `mode`, `ok`, `request_id`, `actor`.
- **Audit** : entrée `studio_workflow_run` dans le ledger (selon config gouvernance, ex. `platform/ssot/governance/audit_ledger.json` si utilisé).
- **Rapport CI** : `runtime/reports/CI_REPORT.md` (aucun `CI_REPORT.md` à la racine).

## Erreurs courantes

- **400 workflow_id required** : body sans `workflow_id`.
- **400 workflow_id not found in definitions** : `workflow_id` absent de `workflow_definitions.json`.
- **403 Forbidden** : permissions studio requises (scope `studio.*` / permission équivalente).

## Smoke local

```bash
pnpm api:dev
# autre terminal :
curl -s -X POST http://127.0.0.1:7070/api/studio/workflows/run \
  -H "Content-Type: application/json" \
  -d '{"workflow_id":"workflow:accounting_sync_run"}' | jq .
tail -1 runtime/reports/index/workflows_latest.jsonl | jq .
```
