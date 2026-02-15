# Studio Designer (Phase AB)

## Overview

The Studio Designer extends the Control Plane Studio into a full **Designer** for page structure (sections/tabs), widget placement, data bindings, and actions. All mutations are **changeset-only**; the Designer never writes to SSOT directly. Preview, Diff, and Impact are available; Apply/Publish is **freeze-aware**.

## Architecture: sections_v2-first, tabs-as-sections

- **sections_v2**: The compile pipeline produces `render_graph.<release>.json` with a `sections_v2` array. Each entry is `{ page_id, sections: [{ id, key, label, kind, order, widgets }] }`.
- **Tabs as sections**: Tabs are **sections** (nav_spec `type: "section"` with `page_id` and `section_key`). The page compiler assigns `kind: "tab"` to sections that appear in nav_specs; sections that exist only via widget `section_key` (no nav entry) get `kind: "section"`.
- **No tab routes**: Tabs do **not** create new routes. The invariant **no-tabs-routes** is enforced: no route path’s last segment may equal a section_key. Routing remains manifest-driven; tabs are UI-only.

## Data bindings

- Widgets may declare `data_bindings`: `{ binding_id, datasource_id, query_id, budget_id? }`.
- **Validation**: Gates (BindingGate, WidgetIsolationGate) ensure `datasource_id` and `query_id` exist in SSOT (query_catalog, data_sources) and that bindings are complete. Budget is optional.
- **Designer**: The Designer UI lets users attach bindings to the selected widget; validation is done at preview/gates.

## Actions (action-bus, policy_id required)

- Widgets may declare `actions`: `{ action_id, kind, policy_id, input_schema_ref? }`.
- **Whitelist**: Only action-bus kinds from the whitelist (e.g. `navigate`, `open_modal`, `submit_form`, `call_workflow`, `export_pdf`) are accepted; ActionPolicyGate fails otherwise.
- **policy_id**: Mandatory. Dry-run / preview validation refuses actions without `policy_id`; gates (WidgetIsolationGate, ActionPolicyGate) enforce this.

## Preview workflow

1. **Create changeset** (draft).
2. **Add ops** via API: pages, nav (sections), widgets (with optional data_bindings and actions).
3. **Preview compile**: `POST /api/changesets/:id/preview` → copies SSOT to preview dir, applies ops, runs compile, writes manifests under `platform/runtime/preview/<id>/manifests`.
4. **Diff**: `GET /api/studio/diff/manifest?preview=<id>` and optionally `GET /api/studio/diff/ssot?preview=<id>`.
5. **Impact**: `GET /api/studio/impact?changeset=<id>`.
6. **Apply/Publish** (if allowed): `POST /api/changesets/:id/publish` → quorum + release; blocked when Change Freeze is active.

## Freeze behavior

- **Change Freeze** (`platform/ssot/governance/change_freeze.json`): `enabled`, `scopes.content_mutations`, `allow_actions`.
- When **freeze.enabled** and **scopes.content_mutations** are true:
  - **UI**: Banner is shown; "Apply" / "Publish" are **disabled** (greyed out + tooltip). Preview, Diff, and Impact remain available.
  - **API**: `POST /api/changesets/:id/publish` returns **423** with `{ error: "Change Freeze active", code: "freeze" }`. An audit event `freeze_blocked_publish` is written.
- Apply/Publish is only allowed if the action is explicitly in `allow_actions` (e.g. breakglass.*) and token/role permits it (no bypass without break-glass/quorum).

## Deep links (studio://)

- **Format**: `studio://<kind>/<id>`
- **Kinds**: `route_spec`, `page_definition`, `nav_spec`, `widget_instance`, `theme` (same as Studio Preview Center).
- Used for navigation and references in Diff/Impact UI.

## Endpoints used by the Designer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/studio/freeze` | Freeze status (enabled, scopes, allow_actions). |
| GET | `/api/studio/pages` | Page inventory. |
| GET | `/api/studio/pages/:id` | Page detail (versions, widgets). |
| GET | `/api/studio/widgets/catalog` | Widget types and schema refs. |
| GET | `/api/studio/queries` | Queries and budgets. |
| POST | `/api/studio/nav` | Add nav_spec (section/link). |
| POST | `/api/studio/widgets` | Add widget_instance. |
| POST | `/api/changesets` | Create changeset. |
| POST | `/api/changesets/:id/preview` | Compile preview. |
| GET | `/api/studio/diff/manifest?preview=<id>` | Manifest diff. |
| GET | `/api/studio/diff/ssot?preview=<id>` | SSOT diff. |
| GET | `/api/studio/impact?changeset=<id>` | Impact. |
| POST | `/api/changesets/:id/publish` | Publish (blocked by freeze with 423). |

## Persistence (changeset-only)

- **Save Draft**: Changes stay in the changeset (ops only); no apply.
- **Preview**: Compile preview + optional diff/impact; no mutation of active SSOT.
- **Apply/Publish**: Only when not blocked by freeze; applies changeset, compiles release, activates per policy.
