# Adapters hardening (Phase AH v1)

Phase AH durcit l’exécution des workflows : contexte enrichi, PDF local réel, quotas storage, journalisation notify/accounting, politique freeze et SAFE_MODE.

## Contexte adapteur (AdapterContext)

- **tenant_id**, **release_id**, **request_id**, **correlation_id** : traçabilité.
- **safe_mode** : quand `true`, seuls les kinds allowlistés peuvent s’exécuter (pdf.generate, storage.*, ocr.ingest, notify.send ; accounting.sync interdit).
- **artifacts_dir**, **reports_dir** : chemins sous `runtime/artifacts` et `runtime/reports`.

## Registry

- Allowlist stricte des kinds (`ALLOWLIST_KINDS`).
- Capability flags par adapteur (ex. `pdf.local`, `stub`, `fs.write`).

## PDF

- **pdf.local** : génération PDF minimale via `pdf-lib` (pas de service externe).
- Fichier produit : `*.pdf` sous `runtime/artifacts/<correlation_id>/`.

## Storage (storage.fs)

- Chemin safe : pas de `../`, résolution sous `artifacts_dir` avec `path.relative` pour éviter traversal.
- Quota soft : taille max par artefact (ex. 10 MB) ; dépassement → erreur.

## Notify / Accounting

- **notify** : stub + journalisation dans `runtime/reports/index/notify_latest.jsonl`.
- **accounting** : stub + journalisation "sync draft" dans `runtime/reports/index/billing_drafts.jsonl` (sans appel externe).

## Politique d’exécution

- **Freeze** : si `freeze.enabled` et `scopes.content_mutations`, `POST /api/studio/workflows/run` avec `mode=execute` retourne **423** (Change Freeze active).
- **SAFE_MODE** (env `SAFE_MODE=1`) : execute autorisé uniquement pour les kinds allowlistés ; `accounting.sync` refusé (step failed).

## Tests CI

- `test-workflow-execute-pdf-local.mjs` : exécute `workflow:pdf_export_invoice`, vérifie artefact `.pdf` + RUN_REPORT.
- `test-execute-freeze-blocks.mjs` : freeze + content_mutations → 423.

## Voir aussi

- `docs/playbooks/workflow-execute-security-playbook.md`
- `docs/architecture/WORKFLOW_EXECUTION_ADAPTERS_V1.md`
