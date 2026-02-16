# Workflow execution adapters (Phase AF v1)

Phase AF ajoute un moteur d’exécution "real_mode" via des **adapters** isolés, sans toucher au Core (CoreChangeGate) et sans casser les invariants SSOT/manifest/gates.

## Principes

- **Mode par défaut** : `dry_run` (zéro effet externe).
- **Mode execute** : activé explicitement (`mode=execute`), écrit des artefacts locaux uniquement (pas d’egress externe).
- **Adapters** : registry allowlist, stubs (pdf, ocr, accounting, notify) + storage FS sandboxé.

## Structure

```
platform/runtime/adapters/
  types.mjs           # shapes runtime (AdapterContext, AdapterStepResult, ALLOWLIST_KINDS)
  registry.mjs        # register(kind, adapter), get(kind), list()
  bootstrap.mjs       # enregistre tous les adapters allowlistés
  adapters/
    storage.fs.mjs    # storage.write, storage.read (sandbox artifacts_dir)
    pdf.stub.mjs      # pdf.generate (stub)
    ocr.stub.mjs      # ocr.ingest (stub)
    accounting.stub.mjs # accounting.sync (stub)
    notify.stub.mjs   # notify.send (stub)
```

## Workflow → steps (mapping in-code v1)

Pas de changement SSOT. Mapping minimal dans `workflow-runner.mjs` :

| workflow_id | steps |
|-------------|--------|
| workflow:pdf_export_invoice | pdf.generate |
| workflow:pdf_export_quote | pdf.generate |
| workflow:pdf_export_report | pdf.generate |
| workflow:ocr_ingest | ocr.ingest |
| workflow:ocr_normalize | ocr.ingest |
| workflow:accounting_sync_run | accounting.sync |
| workflow:job_created_notify | notify.send |
| workflow:doc_ingest_classify | ocr.ingest |

## Artefacts

- **dry_run** : pas d’écriture disque (steps exécutés en mémoire, artefacts stub dans la réponse).
- **execute** :
  - `runtime/artifacts/<correlation_id>/` : fichiers produits par les adapters (ex. pdf_*.stub.json).
  - `runtime/reports/workflows/<correlation_id>/RUN_REPORT.json` + `RUN_REPORT.md`.
  - `runtime/reports/index/workflows_latest.jsonl` : une ligne par run (correlation_id, mode, ok).

## Sécurité / gouvernance

- **execute** exige la même permission que dry_run (`studio.pages.view` ou équivalent S2S).
- En CI : seuls les adapters stubs sont utilisés (pas d’I/O externe).

## Voir aussi

- `docs/playbooks/workflow-execute-playbook.md`
- `docs/playbooks/workflow-dryrun-playbook.md` (Phase AE)
