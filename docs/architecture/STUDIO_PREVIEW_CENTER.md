# Studio Preview Center (Phase Z)

## Overview

The Preview Center compares the **active release** manifest and SSOT to a **preview** (changeset-compiled) manifest and SSOT, and exposes read-only API endpoints for diff and impact. No new server; extensions live in `apps/backend-api/server.mjs` and `platform/runtime/studio/diff-engine.mjs`.

## Data Contract

Unified payload shape (assembled from endpoints or returned where applicable):

```json
{
  "active_release": "<release_id>",
  "preview_release": "preview-<changeset_id>",
  "diff": { "added": [], "removed": [], "changed": [] },
  "gates": [],
  "impact": { "tenant_id", "deltas", "data_gov", "compat", "breaking" }
}
```

- `diff.added` / `removed` / `changed`: arrays of `{ kind, id }` for manifest entities (route_spec, page_definition, nav_spec, widget_instance, theme).
- `gates`: optional gate run summary (e.g. from `runtime/reports/gates/`).
- `impact`: reuse of marketplace impact engine; `breaking` is true if routes/pages/nav were removed.

## Endpoints (read-only)

| Method | Path | Query | Description |
|--------|------|--------|-------------|
| GET | `/api/studio/diff/manifest` | `preview=<id>` | Diff active vs preview manifest. Returns `active_release`, `preview_release`, `diff`, `gates`. |
| GET | `/api/studio/diff/ssot` | `preview=<id>` | Diff active vs preview SSOT (file-level). Returns `active_release`, `preview_release`, `diff` (path arrays). |
| GET | `/api/studio/impact` | `changeset=<id>` | Build preview from changeset, run impact engine. Returns `active_release`, `preview_release`, `impact`. |

All require `studio.pages.view` (or equivalent studio read scope). Preview must exist for diff (run POST `/api/changesets/:id/preview` first).

## Diff Engine

- **Location:** `platform/runtime/studio/diff-engine.mjs`
- **Exports:** `diffManifests(activeManifest, previewManifest)` → `{ added, removed, changed }`; `diffSsotFiles(activeFiles, previewFiles)` → `{ added, removed, changed }` (path strings).
- No external libs; uses existing manifest shape. Manifest loader is used by the server; diff engine receives plain objects.

## Object Deep Link Format

Standardized deep links for Studio objects (generate only; no router rewrite):

- **Format:** `studio://<kind>/<id>`
- **Examples:**
  - `studio://route_spec/r-invoices`
  - `studio://widget_instance/w-table-01`
  - `studio://page_definition/p-dashboard`
  - `studio://nav_spec/nav-main`

Kinds align with diff engine: `route_spec`, `page_definition`, `nav_spec`, `widget_instance`, `theme`.

## Dependencies

- Active release must be set and manifest present under `runtime/manifests` (or `MANIFESTS_DIR`).
- Preview is built under `platform/runtime/preview/<id>/ssot` and `.../manifests`; compile and gates must have been run (e.g. via POST preview).
- Impact reuses `platform/runtime/marketplace/impact.mjs` `analyzeInstall()` with a synthetic studio item.

## CI

- `scripts/ci/test-diff-engine-smoke.mjs`: create changeset, add page/route/nav, POST preview, GET diff manifest, assert non-empty delta.
- `scripts/ci/test-studio-preview-flow.mjs`: same flow plus GET impact, assert delta and impact.breaking.

Both wired in `scripts/ci/ci-all.mjs`.
