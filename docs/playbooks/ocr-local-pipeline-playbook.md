# OCR local pipeline playbook (Phase AJ)

Playbook pour exécuter et vérifier le pipeline OCR en mode local (stub, sans service externe).

## Workflows

1. **ocr_ingest** : `POST /api/studio/workflows/run` avec `workflow_id: "workflow:ocr_ingest"`, `mode: "execute"`, `inputs: { path: "<localfs path>" }`. Produit `ingested_<corr>_<ts>.json` sous `runtime/artifacts/<corr>/`.
2. **ocr_normalize** : même API avec `workflow_id: "workflow:ocr_normalize"`, `inputs: { ingest_artifact_path: "<artifact name>" }`. Produit `normalized_<corr>_<ts>.json`.

## Index

- `runtime/reports/index/ocr_latest.jsonl` : une ligne par step (ts, correlation_id, step, ok, artifact_paths).

## Tests de non-régression

- `node scripts/ci/test-ocr-pipeline-local-stub.mjs` : enchaîne ocr_ingest + ocr_normalize, vérifie artefacts + index + RUN_REPORT.

## Voir aussi

- `docs/architecture/OCR_PIPELINE_V1.md`
