# iCONTROL — Main System Tables + Contents Migration

## Inventory (repo‑wide search)

### Tables found
| Page | Section | Source | Structure | Actions |
| --- | --- | --- | --- | --- |
| verification | verification-table | modules/core-system/ui/frontend-ts/pages/verification/view.ts:3 | columns: ID, Sujet, Statut; rows: model.items | none |

### Non-table legacy content (by page)
- dashboard: header row, user panel, actions row from `modules/core-system/ui/frontend-ts/pages/dashboard/dashboardPage.ts`
- users: title + list from `modules/core-system/ui/frontend-ts/pages/users/view.ts`
- account: title + description from `modules/core-system/ui/frontend-ts/pages/account/view.ts`
- developer: title + notes list from `modules/core-system/ui/frontend-ts/pages/developer/view.ts`
- settings: cards grid from `modules/core-system/ui/frontend-ts/pages/settings/index.ts`
- settings_branding: branding form from `modules/core-system/ui/frontend-ts/pages/settings/branding.ts`

## Migration Summary

### Tables
- verification table → builtin.table via executePlan + SafeRender in:
  - `modules/core-system/ui/frontend-ts/pages/verification/index.ts`

### Non-table contents
- dashboard → section blocks in `modules/core-system/ui/frontend-ts/pages/dashboard.ts`
- users → section blocks in `modules/core-system/ui/frontend-ts/pages/users/index.ts`
- account → section blocks in `modules/core-system/ui/frontend-ts/pages/account/index.ts`
- developer → section blocks in `modules/core-system/ui/frontend-ts/pages/developer/index.ts`
- settings → section blocks in `modules/core-system/ui/frontend-ts/pages/settings/index.ts` (branding removed)
- settings_branding → branding only, protected title in `modules/core-system/ui/frontend-ts/pages/settings/branding.ts`

## Builtin Table Contract Updates
- `app/src/core/studio/runtime/execute.ts`
  - normalizeTable (columns object/array, rows object/array)
  - caption/emptyText support
  - row truncation (200)
  - cxTable class

## Tests Added/Updated
- execute/plan tests for table normalization and rendering:
  - `app/src/core/studio/runtime/execute.test.ts`
  - `app/src/core/studio/runtime/plan.test.ts`
- settings branding guard tests:
  - `modules/core-system/ui/frontend-ts/pages/settings/index.test.ts`
  - `modules/core-system/ui/frontend-ts/pages/settings/branding.test.ts`

## Branding Guard (Non‑negotiable)
- “Identité & marque” appears only in settings_branding; settings does not contain it.

## Manual Runbook
1) `cd app && npm run dev -- --port 5176`
2) Verify routes:
   - `#/dashboard`, `#/users`, `#/account`, `#/verification`, `#/developer`, `#/settings`, `#/settings/branding`
3) Check tables + sections match legacy sources listed above.
