# iCONTROL — Page Migration Report (Legacy → SSOT)

## Legacy Source Inventory (Repo‑wide scan)

### Dashboard (legacy source)
- UI markup: `modules/core-system/ui/frontend-ts/pages/dashboard/dashboardPage.ts:4`
- Events: `modules/core-system/ui/frontend-ts/pages/dashboard/dashboardPage.ts:31`
- Styles: `modules/core-system/ui/frontend-ts/shared/coreStyles.ts:1`
- Dependencies: `platform-services/security/auth/localAuth` (requireSession, logout)

### Users (legacy source)
- UI markup: `modules/core-system/ui/frontend-ts/pages/users/view.ts:7`
- Dependencies: `modules/core-system/ui/frontend-ts/pages/users/model.ts:1`

### Account (legacy source)
- UI markup: `modules/core-system/ui/frontend-ts/pages/account/view.ts:7`
- Dependencies: `modules/core-system/ui/frontend-ts/pages/account/model.ts:1`

### Developer (legacy source)
- UI markup: `modules/core-system/ui/frontend-ts/pages/developer/view.ts:7`
- Dependencies: `modules/core-system/ui/frontend-ts/pages/developer/model.ts:1`

### Verification (legacy source)
- UI markup: `modules/core-system/ui/frontend-ts/pages/verification/view.ts:3`
- Dependencies: `modules/core-system/ui/frontend-ts/pages/verification/model.ts:1`

## Legacy Sections (per page)

### Dashboard
- Header row (title + muted + logout button)
- User info panel (username + role)
- Actions row (return login)

### Users
- Title (h2)
- Users list (ul/li)

### Account
- Title (h2)
- Description paragraph

### Developer
- Title (h2)
- Notes list (ul/li)

### Verification
- Title (h1)
- Description paragraph
- Table (thead + tbody rows)

## Mapping: Legacy → SSOT Sections

### Dashboard
- legacy header row → `dashboard-header` in `modules/core-system/ui/frontend-ts/pages/dashboard.ts`
- legacy user panel → `dashboard-user` in `modules/core-system/ui/frontend-ts/pages/dashboard.ts`
- legacy actions row → `dashboard-actions` in `modules/core-system/ui/frontend-ts/pages/dashboard.ts`

### Users
- legacy list section → `users-list` in `modules/core-system/ui/frontend-ts/pages/users/index.ts`

### Account
- legacy summary section → `account-summary` in `modules/core-system/ui/frontend-ts/pages/account/index.ts`

### Developer
- legacy notes section → `developer-notes` in `modules/core-system/ui/frontend-ts/pages/developer/index.ts`

### Verification
- legacy table section → `verification-table` in `modules/core-system/ui/frontend-ts/pages/verification/index.ts`

## Error Handling / Codes
- Section isolation uses `WARN_SECTION_CRASH` and `WARN_SECTION_BLOCKED` in:
  `modules/core-system/ui/frontend-ts/pages/_shared/sections.ts`

## Tests Added / Updated
- Dashboard sections smoke: `modules/core-system/ui/frontend-ts/pages/dashboard/index.test.ts`
- Inline handler absence for each page: updated page tests in
  `modules/core-system/ui/frontend-ts/pages/*/index.test.ts`

## Manual Runbook
- Start dev: `cd app && npm run dev -- --port 5176`
- Verify routes: `#/dashboard`, `#/users`, `#/account`, `#/verification`, `#/developer`
- Check sections present + no console crashes
