# Designer: Preview, Diff, Impact Playbook

## Objective

Use the Studio Designer to edit pages (sections/tabs, widgets, bindings, actions) in preview mode, inspect Diff and Impact, and Apply/Publish only when Change Freeze allows it.

## Procedure: Designer minimal

1. **Create changeset**  
   - From Studio → Pages, open **Page Designer**.  
   - Click **Create Changeset** (or call `POST /api/changesets`).  
   - Note the changeset ID.

2. **Add section/tab**  
   - Select a page from the inventory.  
   - Add a section: set section key, label, kind (`tab` or `section`), order.  
   - Submit via **Add Section** (uses `POST /api/studio/nav` with nav_spec `type: "section"`).

3. **Add widget + binding + action (policy_id)**  
   - Choose section, pick widget type from palette, **Add Widget to Section** (`POST /api/studio/widgets`).  
   - For the selected widget: set **datasource_id** and **query_id** (binding); set **action kind** and **policy_id** (action).  
   - policy_id is mandatory; gates will fail without it.

4. **Preview compile**  
   - Click **Preview** (`POST /api/changesets/:id/preview`).  
   - Wait for compile to finish; manifests are written under `platform/runtime/preview/<id>/manifests`.

5. **Read Diff + Impact**  
   - **Diff**: Click **Diff** → `GET /api/studio/diff/manifest?preview=<id>`. Inspect added/removed/changed.  
   - **Impact**: Click **Impact** → `GET /api/studio/impact?changeset=<id>`. Check breaking and deltas.

6. **Apply/Publish (if not frozen)**  
   - If **Change Freeze** is active: banner is shown; **Apply/Publish** is disabled. Do not attempt publish; use break-glass/quorum if an emergency release is required.  
   - If freeze is not active: click **Apply/Publish** (`POST /api/changesets/:id/publish`). Requires quorum per policy.

## Troubleshooting: gates failures

| Gate | Typical cause | Action |
|------|----------------|--------|
| **ActionPolicyGate** | Action without `policy_id` or unknown `kind` | Add `policy_id`; use whitelisted kind (navigate, open_modal, submit_form, call_workflow, export_pdf). |
| **BindingGate** | `datasource_id` or `query_id` not in catalog | Ensure query/datasource exist in SSOT (query_catalog, data_sources) or add them via changeset. |
| **WidgetIsolationGate** | Binding missing datasource_id/query_id; action missing policy_id | Complete all bindings and actions with required fields. |
| **PageGraphGate** | Orphan widget in sections_v2 (widget not in widgets list) | Ensure widget_instance is in changeset and page_version.widget_instance_ids includes it. |
| **NoFallbackGate** | Fallback route or template issue | Align routes and templates with manifest contract. |
| **TemplateIntegrityGate** | Template reference or structure invalid | Fix template references and layout. |

## Rules when freeze is active

- **No content mutations** via Apply/Publish; API returns **423** and records `freeze_blocked_publish`.  
- Preview, Diff, and Impact are **read-only** and remain allowed.  
- To release during freeze: use break-glass and/or quorum as per governance (allow_actions, runbooks).

## Useful commands

- **API (dev)**: `node apps/backend-api/server.mjs` (default port 7070; set `SSOT_DIR` if using temp SSOT).  
- **Studio/Control Plane (dev)**: Serve `apps/control-plane` and open Studio → Pages → Page Designer.  
- **CI (full)**: `node scripts/ci/ci-all.mjs` — runs all steps and writes `runtime/reports/CI_REPORT.md`.  
- **Gates on preview**: `node governance/gates/run-gates.mjs preview-<changeset_id>` with `SSOT_DIR` and `MANIFESTS_DIR` set to the preview dir.
