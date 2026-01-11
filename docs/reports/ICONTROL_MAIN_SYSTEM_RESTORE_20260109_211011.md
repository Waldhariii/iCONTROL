# iCONTROL — Main System Source + Migration Report

## SOURCE FOUND
Menu / Shell
- platform-services/ui-shell/layout/shell.ts
  - DOM: header + burger + drawer + nav (class names: cxHeader/cxBurger/cxDrawer/cxNav)
- platform-services/ui-shell/layout/shell.css
  - Styles: .cxHeader/.cxDrawer/.cxNav (exact class layout + spacing)

Dashboard (main system)
- modules/core-system/ui/frontend-ts/pages/dashboard/dashboardPage.ts
  - Markup: cxWrap/cxCard/cxTitle/cxRow + cxLogout/cxGoLogin IDs
- modules/core-system/ui/frontend-ts/shared/coreStyles.ts
  - CSS tokens and base styles for cx* classes

Login (main system)
- modules/core-system/ui/frontend-ts/pages/login/loginPage.ts
  - Markup: cxWrap/cxCard/cxInput/cxBtn + cxLoginBtn IDs

Users / Account / Developer / Verification
- No legacy main-system sources found outside SSOT pages. Search covered repo-wide paths and keywords.

## MIGRATION APPLIED
- Shell DOM construction centralized via shared builder:
  - modules/core-system/ui/frontend-ts/pages/_shared/mainSystem.ui.ts
  - platform-services/ui-shell/layout/shell.ts now uses buildMainSystemShell()
- Sidebar left: CSS updated to keep menu on the left and burger icon on left
  - platform-services/ui-shell/layout/shell.css
- Dashboard SSOT updated to render exact main-system dashboard markup + styles
  - modules/core-system/ui/frontend-ts/pages/dashboard.ts

## SECTIONS MIGRATED
- Dashboard: Core System card, user/role panel, logout + return buttons
- Menu: exact cx* DOM structure retained via shared builder

## NOTES
- No inline on* attributes added; events bound programmatically.
- SafeRender rules unchanged.
