# OCR pipeline v1 (Phase AJ)

Phase AJ pose le **shape** du pipeline OCR en local (sans service OCR externe) : ingest → artifact "ingested", normalize → artifact "normalized", index `ocr_latest.jsonl`.

## Workflows

- **workflow:ocr_ingest** : prend un document blob (ex. `inputs.path` localfs) → produit un artefact JSON `ingested_<corr>_<ts>.json`.
- **workflow:ocr_normalize** : prend l’artefact ingest (ex. `inputs.ingest_artifact_path`) → produit un artefact JSON `normalized_<corr>_<ts>.json`.

## Adapter

- **ocr.ingest** (local stub) : selon `workflow_id` écrit "ingested" ou "normalized" ; journalise dans `runtime/reports/index/ocr_latest.jsonl` (ts, correlation_id, step, ok, artifact_paths).

## Index

- `runtime/reports/index/ocr_latest.jsonl` : une ligne par step (ingest ou normalize).

## Page ocr_inbox

- Les widgets peuvent afficher une queue alimentée par une query `ocr.queue_list` (données depuis l’index local / artifacts). (Implémentation UI optionnelle.)

## Tests CI

- `test-ocr-pipeline-local-stub.mjs` : exécute ocr_ingest puis ocr_normalize, vérifie artefacts + ocr_latest.jsonl + RUN_REPORT.

## Voir aussi

- `docs/playbooks/ocr-local-pipeline-playbook.md`
