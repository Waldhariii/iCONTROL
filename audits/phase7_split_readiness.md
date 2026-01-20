# Phase 7 Split Readiness

## CP-only folders
- app/src/pages/cp
- app/src/core/layout/cpToolboxShell.ts
- app/src/core/layout/cpToolboxShell.css
- app/src/core/runtime/contracts

## Shared runtime
- app/src/core/runtime/safe
- app/src/core/runtime/audit.ts
- app/src/core/runtime/obs.ts
- app/src/core/runtime/accessDenied.ts

## No page-to-page imports (rg)
app/src/moduleLoader.ts:16:import { renderLoginPage as renderLoginCp } from "./pages/cp/login";
app/src/moduleLoader.ts:17:import { renderDashboardPage as renderDashboardCp } from "./pages/cp/dashboard";
app/src/moduleLoader.ts:18:import { renderSystemPage as renderSystemPageCp } from "./pages/cp/system";
app/src/moduleLoader.ts:19:import { renderSettingsPage as renderSettingsPageCp } from "./pages/cp/settings";
app/src/moduleLoader.ts:20:import { renderUsersPage as renderUsersCp } from "./pages/cp/users";
app/src/moduleLoader.ts:21:import { renderAccountPage as renderAccountCp } from "./pages/cp/account";
app/src/moduleLoader.ts:22:import { renderManagementPage as renderManagementCp } from "./pages/cp/management";
app/src/moduleLoader.ts:23:import { renderSubscriptionPage as renderSubscriptionCp } from "./pages/cp/subscription";
app/src/moduleLoader.ts:24:import { renderOrganizationPage as renderOrganizationCp } from "./pages/cp/organization";
app/src/moduleLoader.ts:25:import { renderTwoFactorPage as renderTwoFactorCp } from "./pages/cp/twoFactor";
app/src/moduleLoader.ts:26:import { renderSessionsPage as renderSessionsCp } from "./pages/cp/sessions";
app/src/moduleLoader.ts:27:import { renderBackupPage as renderBackupCp } from "./pages/cp/backup";
app/src/moduleLoader.ts:28:import { renderFeatureFlagsPage as renderFeatureFlagsCp } from "./pages/cp/featureFlags";
app/src/moduleLoader.ts:29:import { renderApiPage as renderApiCp } from "./pages/cp/api";
app/src/moduleLoader.ts:30:import { renderNetworkPage as renderNetworkCp } from "./pages/cp/network";

## Direct hash writes (rg)
app/src/__tests__/toolbox.test.ts:39:    window.location.hash = "#/toolbox";
app/src/__tests__/no-direct-location-hash.contract.test.ts:25:      if (src.includes("location.hash =") || src.includes("window.location.hash =")) {
