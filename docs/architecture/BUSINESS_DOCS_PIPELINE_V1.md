# Business Docs Pipeline v1 (Phase AD)

Base métier "Business Docs Pipeline" entièrement manifest-driven, isolée par modules.

## Pages métier

| Page ID | Slug | Module | Route |
|---------|------|--------|-------|
| page:documents | documents | module:documents | /app/documents |
| page:pdf_exports | pdf-exports | module:pdf_exports | /app/pdf-exports |
| page:ocr_inbox | ocr-inbox | module:ocr_pipeline | /app/ocr-inbox |
| page:accounting_sync | accounting-sync | module:accounting_sync | /app/accounting-sync |

Chaque page est rendue par PRODUCT_RENDERING_V2 (sections_v2), avec section `main` et onglet `tab:activity` ou `tab:settings`.

## Widgets

- **widget:doc_list** — liste documents (binding query:docs.list)
- **widget:pdf_export_button** — action export_pdf + policy_id
- **widget:ocr_queue** — file OCR, action call_workflow → workflow:ocr_ingest
- **widget:accounting_sync_status** — statut sync, action call_workflow → workflow:accounting_sync_run

Instances sur section `main` : wi-doc-list-001, wi-pdf-export-001, wi-ocr-queue-001, wi-acct-sync-001.

## Bindings et actions

- **data_bindings** : `datasource_id` + `query_id` (query_catalog / query_budgets).
- **actions** :
  - `export_pdf` : `policy_id` obligatoire (ex. policy:default).
  - `call_workflow` : `workflow_id` + `policy_id`. Aucune action "unknown" (action bus refuse).

## Policies et workflows

- Guard pack : `guard:default` sur toutes les routes bizdocs.
- Workflows utilisés : workflow:ocr_ingest, workflow:accounting_sync_run (stub).
- Policies : policy:default pour toutes les actions widget.

## Modules

- module:documents, module:pdf_exports, module:ocr_pipeline, module:accounting_sync.
- Pages visibles uniquement quand le module est activé (module_activations / tenant).

## Invariants

- **Pas de hardcode CSS** : TokenGate ; widgets token-safe.
- **Mutations via changeset uniquement** : respect de change_freeze.json ; si freeze actif, utiliser changeset / temp SSOT pour tests.
- **Isolation** : WidgetIsolationGate, BindingGate, ActionPolicyGate, PerfBudgetGate.
- **Aucun système parallèle** : uniquement registres SSOT existants (pages, routes, nav, widgets, queries, workflows).

## Smoke local

```bash
pnpm api:dev
pnpm client:dev
```

Puis vérifier les routes /app/documents, /app/pdf-exports, /app/ocr-inbox, /app/accounting-sync (selon modules activés).
