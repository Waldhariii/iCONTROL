# Workflow execute playbook (Phase AF)

Exécuter les workflows BizDocs en mode **execute** via l’API : artefacts écrits localement (runtime/artifacts, runtime/reports/workflows), sans egress externe.

## Prérequis

- API démarrée : `pnpm api:dev` ou `node apps/backend-api/server.mjs` (CI : `CI=true HOST=127.0.0.1 PORT=0`).
- `workflow_id` présent dans `platform/ssot/studio/workflows/workflow_definitions.json`.

## Endpoint

- **POST** `/api/studio/workflows/run`
- Body JSON : `{ "workflow_id": "workflow:...", "mode": "execute", "inputs": {} }`
- Headers : `Content-Type: application/json`, autorisation (Bearer ou S2S avec scope studio.*).

## Exemple curl

```bash
curl -s -X POST http://127.0.0.1:7070/api/studio/workflows/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"workflow_id":"workflow:pdf_export_invoice","mode":"execute"}'
```

## Réponse attendue (200)

```json
{
  "ok": true,
  "workflow_id": "workflow:pdf_export_invoice",
  "mode": "execute",
  "steps": [{ "step_id": "pdf.generate_0", "status": "ok", "kind": "pdf.generate" }],
  "artifacts": [{ "artifact_id": "pdf_<corr>_<ts>.stub.json", "kind": "pdf.generate" }],
  "correlation_id": "<uuid>"
}
```

## Artefacts générés

- **runtime/artifacts/<correlation_id>/** : fichiers produits par les adapters (stubs ou storage).
- **runtime/reports/workflows/<correlation_id>/RUN_REPORT.json** : résumé du run (ok, steps, artifacts).
- **runtime/reports/workflows/<correlation_id>/RUN_REPORT.md** : résumé lisible.
- **runtime/reports/index/workflows_latest.jsonl** : une ligne ajoutée par run (correlation_id, mode=execute, ok).

## CI

- Test : `node scripts/ci/test-workflow-execute-localfs.mjs`
- Vérifie : 200, mode=execute, RUN_REPORT.json présent, artefacts sous runtime/artifacts/<corr>, index jsonl mis à jour.

## Voir aussi

- `docs/architecture/WORKFLOW_EXECUTION_ADAPTERS_V1.md`
- `docs/playbooks/workflow-dryrun-playbook.md` (dry_run)
