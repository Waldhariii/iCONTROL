# BizDocs execution flow (Phase AI v1)

Phase AI relie l’action UI **export_pdf** au workflow execute : un clic (ou `POST /api/studio/action` avec `kind: export_pdf`) déclenche l’exécution du workflow PDF et produit un artefact `.pdf` + index + audit.

## Flux

1. **Client** : `POST /api/studio/action` avec `{ action_id, kind: "export_pdf", policy_id }`.
2. **Action bus** : valide `policy_id`, route vers `runWorkflow(workflow_id, mode=execute)`.
3. **Workflow** : `workflow:pdf_export_invoice` par défaut (ou mapping `page_id` → `workflow_id`).
4. **Résultat** : artefact sous `runtime/artifacts/<correlation_id>/*.pdf`, `runtime/reports/workflows/<correlation_id>/RUN_REPORT.json`, ligne dans `workflows_latest.jsonl`, audit `studio_action_dispatch`.

## Mapping page → workflow

- Optionnel : `page_id` dans le payload action permet de choisir le workflow (ex. `page:pdf_exports` → `workflow:pdf_export_invoice`).
- Par défaut : `workflow:pdf_export_invoice`.

## Sécurité

- Même permission que les autres actions studio (`studio.pages.view` ou S2S équivalent).
- Freeze + content_mutations bloque l’exécution (voir Phase AH).

## Tests CI

- `test-action-export-pdf-end2end.mjs` : POST action export_pdf → vérifie artefact pdf + workflows_latest.jsonl + RUN_REPORT.

## Voir aussi

- `docs/architecture/ADAPTERS_HARDENING_V1.md`
- `docs/architecture/WORKFLOW_EXECUTION_ADAPTERS_V1.md`
