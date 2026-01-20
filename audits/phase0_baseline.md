# Phase 0 Baseline

## git status --porcelain
 M .github/workflows/cp-proofs.yml
 D _RELEASE_NOTES_v0.2.0-rc1.md
 D _RELEASE_NOTES_v0.2.0-rc3.md
 D _RELEASE_NOTES_v0.2.0-tools1.md
 D _RELEASE_NOTES_v0.2.0-tools2.md
 D _RELEASE_NOTES_v0.2.0-tools3.md
 D _RELEASE_NOTES_v0.2.0-tools4.md
 D _RELEASE_NOTES_v0.2.0-tools5.md
 D _RELEASE_NOTES_v0.2.0-tools6.md
 D _RELEASE_NOTES_v0.2.0-tools7.md
 D _RELEASE_NOTES_v0.2.0-tools8.md
 D _RELEASE_NOTES_v0.2.0-tools9.md
 D _RELEASE_NOTES_vX.Y.Z.md
 D _REPORTS/ICONTROL_SYSTEM_ANALYSIS_20260109_170342.md
 D _REPORTS/INDEX.md
 M app/index.html
 M app/package.json
 M app/src/__tests__/access-guard.contract.test.ts
 M app/src/__tests__/app-login.session-scope.contract.test.ts
 M app/src/__tests__/auditlog-entitlements.contract.test.ts
 M app/src/__tests__/auth-cookie.samesite-strict.contract.test.ts
 M app/src/__tests__/cp-login.session-scope.contract.test.ts
 M app/src/core/ui/errorState.ts
 M app/src/core/ui/pageShell.ts
 M app/src/core/ui/sectionCard.ts
 M app/src/core/ui/toolbar.ts
 M app/src/localAuth.ts
 M app/src/main.ts
 M app/src/moduleLoader.ts
 D app/src/pages/README_DISABLED.md
 D app/src/pages/README_DUPLICATE_PAGES_DISABLED.md
 D app/src/pages/_shared/sections.ts
 M app/src/pages/cp/dashboard.ts
 M app/src/pages/cp/subscription.ts
 M app/src/pages/cp/system.ts
 M app/src/pages/cp/users.ts
 M app/src/pages/cp/views/users.ts
 D app/src/pages/dashboard.ts.disabled
 D app/src/pages/login.ts.disabled
 M app/src/router.ts
 M app/src/runtime/navigate.ts
 M app/src/runtime/rbac.ts
 M app/tsconfig.json
 M app/vite.config.ts
 M core-kernel/contracts/BrandingPort.ts
 D docs/ICONTROL_MAIN_SYSTEM_TABLES_MIGRATION_20260110_091609.md
 D docs/ICONTROL_PAGE_MIGRATION_20260109_212713.md
 D docs/reports/ICONTROL_EXISTING_PAGES_WIRING_20260109_200900.md
 D docs/reports/ICONTROL_MAIN_SYSTEM_RESTORE_20260109_211011.md
 D docs/reports/ICONTROL_SYSTEM_RECOMMENDATIONS_APPLIED_20260109_174741.md
 D modules/core-system/ui/frontend-ts/index.ts
 M modules/core-system/ui/frontend-ts/pages/_shared/mainSystem.shared.ts
 M modules/core-system/ui/frontend-ts/pages/_shared/mainSystem.ui.ts
 M modules/core-system/ui/frontend-ts/pages/_shared/rolePolicy.ts
 M modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks.ts
 M modules/core-system/ui/frontend-ts/pages/account/contract.ts
 M modules/core-system/ui/frontend-ts/pages/account/index.ts
 M modules/core-system/ui/frontend-ts/pages/account/model.ts
 M modules/core-system/ui/frontend-ts/pages/account/view.ts
 M modules/core-system/ui/frontend-ts/pages/blocked/index.ts
 M modules/core-system/ui/frontend-ts/pages/dashboard.ts
 D modules/core-system/ui/frontend-ts/pages/dashboard/dashboardPage.ts
 M modules/core-system/ui/frontend-ts/pages/developer/contract.ts
 M modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx
 M modules/core-system/ui/frontend-ts/pages/developer/index.test.ts
 M modules/core-system/ui/frontend-ts/pages/developer/index.tsx
 M modules/core-system/ui/frontend-ts/pages/developer/model.ts
 M modules/core-system/ui/frontend-ts/pages/developer/sections/audit-log.ts
 M modules/core-system/ui/frontend-ts/pages/developer/sections/contracts-form.ts
 M modules/core-system/ui/frontend-ts/pages/developer/sections/contracts-table.ts
 M modules/core-system/ui/frontend-ts/pages/developer/sections/datasources-viewer.ts
 M modules/core-system/ui/frontend-ts/pages/developer/sections/registry-viewer.ts
 M modules/core-system/ui/frontend-ts/pages/developer/sections/rules-viewer.ts
 M modules/core-system/ui/frontend-ts/pages/developer/view.ts
 M modules/core-system/ui/frontend-ts/pages/dossiers/contract.ts
 M modules/core-system/ui/frontend-ts/pages/dossiers/index.test.ts
 M modules/core-system/ui/frontend-ts/pages/dossiers/index.ts
 M modules/core-system/ui/frontend-ts/pages/dossiers/model.ts
 M modules/core-system/ui/frontend-ts/pages/dossiers/sections/actions.ts
 M modules/core-system/ui/frontend-ts/pages/dossiers/sections/bulk.ts
 M modules/core-system/ui/frontend-ts/pages/dossiers/sections/create.ts
 M modules/core-system/ui/frontend-ts/pages/dossiers/sections/detail.ts
 M modules/core-system/ui/frontend-ts/pages/dossiers/sections/filters.ts
 M modules/core-system/ui/frontend-ts/pages/dossiers/sections/history.ts
 M modules/core-system/ui/frontend-ts/pages/dossiers/sections/list.ts
 M modules/core-system/ui/frontend-ts/pages/dossiers/sections/rules.ts
 M modules/core-system/ui/frontend-ts/pages/dossiers/sections/safe-mode.ts
 M modules/core-system/ui/frontend-ts/pages/dossiers/sections/storage.ts
 D modules/core-system/ui/frontend-ts/pages/login/loginPage.ts
 M modules/core-system/ui/frontend-ts/pages/logs/contract.ts
 M modules/core-system/ui/frontend-ts/pages/logs/index.test.ts
 M modules/core-system/ui/frontend-ts/pages/logs/index.ts
 M modules/core-system/ui/frontend-ts/pages/logs/sections/audit-log.ts
 M modules/core-system/ui/frontend-ts/pages/logs/sections/export.ts
 M modules/core-system/ui/frontend-ts/pages/logs/sections/filters.ts
 M modules/core-system/ui/frontend-ts/pages/logs/sections/local-audit.ts
 M modules/core-system/ui/frontend-ts/pages/logs/sections/retention.ts
 M modules/core-system/ui/frontend-ts/pages/settings/branding.ts
 M modules/core-system/ui/frontend-ts/pages/settings/index.ts
 M modules/core-system/ui/frontend-ts/pages/settings/subscriptionHub.ts
 M modules/core-system/ui/frontend-ts/pages/system/contract.ts
 M modules/core-system/ui/frontend-ts/pages/system/index.ts
 M modules/core-system/ui/frontend-ts/pages/system/model.ts
 M modules/core-system/ui/frontend-ts/pages/system/sections/cache-audit.ts
 M modules/core-system/ui/frontend-ts/pages/system/sections/flags-actions.ts
 M modules/core-system/ui/frontend-ts/pages/system/sections/flags.ts
 M modules/core-system/ui/frontend-ts/pages/system/sections/layout.ts
 M modules/core-system/ui/frontend-ts/pages/system/sections/safe-mode-actions.ts
 M modules/core-system/ui/frontend-ts/pages/system/sections/safe-mode.ts
 M modules/core-system/ui/frontend-ts/pages/toolbox.ts
 M modules/core-system/ui/frontend-ts/pages/users/contract.ts
 M modules/core-system/ui/frontend-ts/pages/users/index.ts
 M modules/core-system/ui/frontend-ts/pages/users/model.ts
 M modules/core-system/ui/frontend-ts/pages/users/view.ts
 M modules/core-system/ui/frontend-ts/pages/verification/contract.ts
 M modules/core-system/ui/frontend-ts/pages/verification/index.ts
 M modules/core-system/ui/frontend-ts/pages/verification/model.ts
 M modules/core-system/ui/frontend-ts/pages/verification/view.ts
 M modules/core-system/ui/frontend-ts/shared/coreStyles.ts
 M package.json
 D platform-services/security/auth/localAuth.ts
 M platform-services/ui-shell/layout/shell.css
 M platform-services/ui-shell/layout/shell.ts
 D routes_inspect.sh
 M scripts/check-logs-route.js
 M scripts/smoke-local-web.sh
 M server/runtime-config-server.js
?? ._WIP_BACKUPS/
?? .github/workflows/ci-complete.yml
?? PROMPTS_GENERATION_IMAGES_CHATGPT.md
?? SPECIFICATION_COMPLETE_PAGES_DETAILLEE.md
?? SPECIFICATION_VISUELLE_INTERFACE.md
?? _AMELIORATIONS_APPLIQUEES.md
?? _AMELIORATIONS_APP_CONTROLE_PARFAITE.md
?? _AMELIORATIONS_FINALES_PARFAITES.md
?? _AMELIORATIONS_SPECIFICATION_IMPLEMENTATION.md
?? _ANALYSE_AMELIORATIONS_MANQUANTES.md
?? _ANALYSE_PAGES_PARTAGEES.md
?? _ANALYSE_SYSTEME_EDITION_VISUEL.md
?? _AUDIT_100_POURCENT_FINAL.md
?? _AUDIT_MATURITE_ENTERPRISE.md
?? _CORRECTIONS_FINALES_100_POURCENT.md
?? _CORRECTIONS_MENU_VISUEL.md
?? _CORRECTIONS_VISUEL_FINALES.md
?? _IMPLEMENTATION_EDITOR_COMPLET.md
?? _LISTE_AMELIORATIONS_COMPLETE.md
?? _LISTE_PAGES_COMPLETE.md
?? _PERFECTION_11000_POURCENT.md
?? _PERFECTION_ANALYSE_CRITIQUE.md
?? _PLAN_AMELIORATION_EDITEUR_COMPLET.md
?? "_PROBL\303\210MES_RESTANTS_MINEURS.md"
?? "_PROGRESSION_IMPL\303\211MENTATION.md"
?? _RESUME_AMELIORATIONS_PAGES.md
?? _RESUME_MODIFICATIONS_EDITEUR.md
?? "_R\303\211SUM\303\211_110_POURCENT.md"
?? "_R\303\211SUM\303\211_AM\303\211LIORATIONS_MANQUANTES.md"
?? "_R\303\211SUM\303\211_FINAL_COMPLET.md"
?? "_R\303\211SUM\303\211_FINAL_SYST\303\210ME_PARFAIT.md"
?? "_R\303\211SUM\303\211_IMPL\303\211MENTATION.md"
?? "_STATUT_FINAL_SYST\303\210ME.md"
?? "_SYST\303\210ME_100_COMPLET_FINAL.md"
?? "_SYST\303\210ME_100_POURCENT_COMPLET.md"
?? "_SYST\303\210ME_100_POURCENT_PARFAIT_FINAL.md"
?? "_SYST\303\210ME_100_POURCENT_TERMIN\303\211.md"
?? "_SYST\303\210ME_PARFAIT_FINAL.md"
?? "_SYST\303\210ME_ULTIME_COMPLET.md"
?? "_SYST\303\210ME_VISUEL_110000_POURCENT.md"
?? _VERIFICATION_FINALE_100_POURCENT.md
?? "_V\303\211RIFICATION_FINALE_COMPL\303\210TE.md"
?? app/public/
?? app/src/__tests__/core/
?? app/src/core/api/
?? app/src/core/audit/auditExport.ts
?? app/src/core/backup/
?? app/src/core/branding/
?? app/src/core/cache/
?? app/src/core/data/
?? app/src/core/degradation/
?? app/src/core/editor/
?? app/src/core/errors/errorBoundary.ts
?? app/src/core/errors/errorTracker.ts
?? app/src/core/features/
?? app/src/core/help/
?? app/src/core/i18n/
?? app/src/core/layout/
?? app/src/core/monitoring/
?? app/src/core/pageEditor/
?? app/src/core/performance/
?? app/src/core/permissions/
?? app/src/core/release/
?? app/src/core/reports/
?? app/src/core/responsive/
?? app/src/core/runtime/accessDenied.ts
?? app/src/core/runtime/audit.ts
?? app/src/core/runtime/contracts/
?? app/src/core/runtime/obs.ts
?? app/src/core/runtime/safe/
?? app/src/core/security/
?? app/src/core/session/
?? app/src/core/subscriptions/
?? app/src/core/themes/
?? app/src/core/ui/accessibility.ts
?? app/src/core/ui/actionButton.ts
?? app/src/core/ui/advancedSearch.ts
?? app/src/core/ui/alert.ts
?? app/src/core/ui/buttonGroup.ts
?? app/src/core/ui/charts.ts
?? app/src/core/ui/charts/
?? app/src/core/ui/commandPalette.ts
?? app/src/core/ui/confirmDialog.ts
?? app/src/core/ui/dataTable.ts
?? app/src/core/ui/dragDrop.ts
?? app/src/core/ui/dropdownButton.ts
?? app/src/core/ui/emptyState.ts
?? app/src/core/ui/excelExport.ts
?? app/src/core/ui/exportUtils.ts
?? app/src/core/ui/formBuilder.ts
?? app/src/core/ui/formField.ts
?? app/src/core/ui/globalSearch.ts
?? app/src/core/ui/iconButton.ts
?? app/src/core/ui/importUtils.ts
?? app/src/core/ui/keyboardShortcuts.ts
?? app/src/core/ui/lazyLoader.ts
?? app/src/core/ui/notificationCenter.ts
?? app/src/core/ui/onboarding.ts
?? app/src/core/ui/pageHelper.ts
?? app/src/core/ui/pageState.ts
?? app/src/core/ui/progressBar.ts
?? app/src/core/ui/responsiveForm.tsx
?? app/src/core/ui/responsiveTable.tsx
?? app/src/core/ui/riskConfirmModal.ts
?? app/src/core/ui/skeletonLoader.ts
?? app/src/core/ui/spinner.ts
?? app/src/core/ui/tableSelection.ts
?? app/src/core/ui/toast.ts
?? app/src/core/ui/toolboxLayout.css
?? app/src/core/ui/toolboxLayout.ts
?? app/src/core/ui/toolboxPanel.ts
?? app/src/core/ui/tooltip.ts
?? app/src/core/ui/uiBlocks.ts
?? app/src/core/ui/updateModal.ts
?? app/src/core/user/
?? app/src/core/utils/
?? app/src/pages/_shared/loginHelpers.ts
?? app/src/pages/app/
?? app/src/pages/appContext.ts
?? app/src/pages/cp/account.ts
?? app/src/pages/cp/api.ts
?? app/src/pages/cp/backup.ts
?? app/src/pages/cp/featureFlags.ts
?? app/src/pages/cp/login.ts
?? app/src/pages/cp/management.ts
?? app/src/pages/cp/models/
?? app/src/pages/cp/network.ts
?? app/src/pages/cp/organization.ts
?? app/src/pages/cp/sessions.ts
?? app/src/pages/cp/settings.ts
?? app/src/pages/cp/twoFactor.ts
?? app/src/pages/cp/views/account.ts
?? app/src/pages/cp/views/system.ts
?? app/vitest.config.ts
?? audits/
?? cp-system-proofs.patch
?? cp-system-proofs.strict.patch
?? dist
?? docs/ICONES_MAC.md
?? docs/INTEGRATION_WEB.md
?? docs/adr/ADR-000-error-tracking.md
?? docs/adr/ADR-001-feature-flags.md
?? docs/architecture/ENTERPRISE_DEPLOY_RELEASE.md
?? docs/architecture/RELEASE_SYSTEM_USAGE.md
?? modules/core-system/ui/frontend-ts/pages/_shared/toolboxCard.ts
?? modules/core-system/ui/frontend-ts/shared/audit.ts
?? modules/core-system/ui/frontend-ts/shared/entitlements.ts
?? modules/core-system/ui/frontend-ts/shared/localAuth.ts
?? modules/core-system/ui/frontend-ts/shared/mainSystem.data.ts
?? modules/core-system/ui/frontend-ts/shared/mainSystem.shared.ts
?? modules/core-system/ui/frontend-ts/shared/mainSystem.ui.ts
?? modules/core-system/ui/frontend-ts/shared/obsCodes.ts
?? modules/core-system/ui/frontend-ts/shared/recommendations.ctx.ts
?? modules/core-system/ui/frontend-ts/shared/recommendations.ts
?? modules/core-system/ui/frontend-ts/shared/renderAccessDenied.ts
?? modules/core-system/ui/frontend-ts/shared/rolePolicy.ts
?? modules/core-system/ui/frontend-ts/shared/safeMode.ts
?? modules/core-system/ui/frontend-ts/shared/sections.ts
?? modules/core-system/ui/frontend-ts/shared/storage.ts
?? modules/core-system/ui/frontend-ts/shared/themeCssVars.ts
?? modules/core-system/ui/frontend-ts/shared/toolboxCard.ts
?? modules/core-system/ui/frontend-ts/shared/uiBlocks.ts
?? modules/scan-manager/
?? proofs/
?? scripts/add-app-icons.sh
?? scripts/check-account-route.js
?? scripts/check-api-route.js
?? scripts/check-dashboard-route.js
?? scripts/check-developer-entitlements-route.js
?? scripts/check-developer-route.js
?? scripts/check-network-route.js
?? scripts/check-system-route.js
?? scripts/check-verification-route.js
?? scripts/create-mac-apps.sh
?? scripts/launch-app-admin.sh
?? scripts/launch-app-client.sh
?? scripts/launch-local-web.sh
?? scripts/maintenance/backup-and-cleanup.sh
?? scripts/maintenance/backup-releases-reports.sh
?? scripts/maintenance/cleanup-obsolete.sh
?? scripts/rebuild-and-serve.sh
?? scripts/stop-server.sh
?? server/config.production.js

## window.location.hash assignments
app/src/__tests__/no-direct-location-hash.contract.test.ts:25:      if (src.includes("location.hash =") || src.includes("window.location.hash =")) {
app/src/__tests__/toolbox.test.ts:39:    window.location.hash = "#/toolbox";

## navigate/getCurrentHash usage
app/src/pages/cp/system.ts:298:            onClick: () => { navigate("#/logs"); }
app/src/pages/cp/subscription.ts:501:  navigate(`#/subscription?tab=${tab}`);
app/src/pages/cp/subscription.ts:505:  const hash = getCurrentHash() || "";
app/src/pages/cp/organization.ts:235:  const hash = getCurrentHash();
app/src/pages/cp/organization.ts:242:  const hash = getCurrentHash();
app/src/pages/cp/organization.ts:472:      navigate(`#/organization?id=${org.id}`);
app/src/pages/cp/organization.ts:496:      navigate(`#/organization?id=${org.id}`);
app/src/pages/cp/organization.ts:505:      navigate(`#/organization?id=${org.id}`);
app/src/pages/cp/organization.ts:807:  const hash = getCurrentHash();
app/src/pages/cp/organization.ts:946:        navigate(`#/organization?id=${orgIdFromHash}&tab=users&userId=${user.id}`);
app/src/pages/cp/organization.ts:1166:        navigate(`#/organization?id=${orgId}&tab=users`);
app/src/pages/cp/organization.ts:1195:    navigate(`#/organization?id=${orgId}&tab=users`);
app/src/pages/cp/organization.ts:1268:      navigate(`#/organization?id=${orgId}&tab=users`);
app/src/pages/cp/organization.ts:1290:        navigate(`#/organization?id=${orgId}&tab=users`);
app/src/pages/cp/organization.ts:1770:        navigate("#/organization");
app/src/pages/cp/organization.ts:1812:    navigate("#/organization");
app/src/pages/cp/organization.ts:1929:      navigate(`#/organization?id=${orgId}&tab=${tab.id}`);
app/src/pages/cp/dashboard.ts:120:          { label: "Logs", icon: "📋", onClick: () => { navigate("#/logs"); } }
app/src/pages/cp/dashboard.ts:342:      { label: "Voir logs", onClick: () => { navigate("#/logs"); } }
app/src/pages/cp/api.ts:326:            onClick: () => { navigate("#/logs"); }
app/src/pages/cp/network.ts:287:            onClick: () => { navigate("#/logs"); }
app/src/pages/cp/management.ts:83:  const hash = getCurrentHash();
app/src/pages/cp/management.ts:117:      navigate(`#/management${tab.id !== "overview" ? `?tab=${tab.id}` : ""}`);
app/src/pages/cp/management.ts:145:    btn.onclick = () => navigate("#/developer");
app/src/pages/cp/management.ts:353:    const hash = getCurrentHash();
app/src/pages/_shared/loginHelpers.ts:59:      navigate("#/dashboard");
modules/core-system/ui/frontend-ts/pages/blocked/index.test.ts:4:  it("importing blocked page does not navigate()", async () => {
app/src/pages/app/dashboard.ts:49:    navigate("#/login");
app/src/pages/app/dashboard.ts:75:  btnDossiers.addEventListener("click", () => navigate("#/dossiers"));
app/src/main.ts:71:    const hash = getCurrentHash() || "";
modules/core-system/ui/frontend-ts/pages/settings/branding.ts:54:    navigate("#/dashboard");
modules/core-system/ui/frontend-ts/pages/settings/branding.ts:138:    navigate("#/settings");
modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx:255:        { label: "Aller a Developer", onClick: () => { navigate("#/developer"); } }
modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx:301:          { label: "Voir logs", onClick: () => { navigate("#/logs"); } }
modules/core-system/ui/frontend-ts/pages/activation/index.tsx:171:      navigate("#/dashboard");
app/src/__tests__/activation-manual.contract.test.ts:10:  it("importing activation page does not call navigate()", async () => {
modules/core-system/ui/frontend-ts/pages/login.ts:58:    navigate("#/dashboard");
modules/core-system/ui/frontend-ts/pages/verification/index.ts:240:          { label: "Voir logs", onClick: () => { navigate("#/logs"); } }
modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks.ts:180:  navigate(target);
modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks.ts:378:  navigate(target);
modules/core-system/ui/frontend-ts/pages/dashboard.ts:28:  navigate(`#/access-denied?entitlement=${q}`);
modules/core-system/ui/frontend-ts/pages/dashboard.ts:69:  navigate("#/login");
modules/core-system/ui/frontend-ts/pages/dashboard.ts:148:  navigate("#/login");
modules/core-system/ui/frontend-ts/pages/developer/index.tsx:144:    actionsBody.appendChild(createActionButton("Ouvrir entitlements", false, () => { navigate("#/developer/entitlements"); }));
modules/core-system/ui/frontend-ts/pages/developer/index.tsx:267:          { label: "Voir logs", onClick: () => { navigate("#/logs"); } }
app/src/__tests__/no-import-sideeffects-critical.contract.test.ts:7: * We enforce this by spying on the canonical navigate() function rather than
app/src/__tests__/no-import-sideeffects-critical.contract.test.ts:11:// IMPORTANT: path must match where modules import navigate() from.
app/src/__tests__/no-import-sideeffects-critical.contract.test.ts:14:  // but for this test we only need navigate().
app/src/__tests__/no-import-sideeffects-critical.contract.test.ts:32:  it("importing localAuth does not call navigate()", async () => {
app/src/__tests__/no-import-sideeffects-critical.contract.test.ts:38:  it("importing dashboard page module does not call navigate()", async () => {
app/src/__tests__/no-import-sideeffects-critical.contract.test.ts:44:  it("importing access-denied page does not call navigate()", async () => {
app/src/__tests__/no-import-sideeffects-critical.contract.test.ts:51:  it("importing modules login page does not call navigate()", async () => {
app/src/__tests__/no-import-sideeffects-critical.contract.test.ts:57:  it("importing modules settings page does not call navigate()", async () => {
app/src/__tests__/no-import-sideeffects-critical.contract.test.ts:63:  it("importing app router does not call navigate()", async () => {
app/src/__tests__/no-import-sideeffects-critical.contract.test.ts:69:  it("importing app runtime router does not call navigate()", async () => {
modules/core-system/ui/frontend-ts/pages/logs/index.ts:262:            onClick: () => { navigate("#/dashboard"); }
app/src/core/pageEditor/pageModificationManager.ts:280:    const pageId = getCurrentHash() || window.location.pathname;
app/src/core/editor/visualEditor.ts:940:  const pageId = getCurrentHash() || window.location.pathname;
app/src/core/errors/errorBoundary.ts:207:  homeBtn.onclick = () => { navigate("#/dashboard"); };
modules/core-system/ui/frontend-ts/pages/dossiers/sections/list.ts:111:        navigate(`#/dossiers/${d.id}`);
app/src/router.ts:80:export function navigate(hash: string): void {
app/src/router.ts:92:    navigate("#/login");
app/src/router.ts:107:  navigate("#/login");
app/src/runtime/navigate.ts:5:export function navigate(hashRoute: string): void {
app/src/runtime/navigate.ts:11:export function getCurrentHash(): string {
app/src/runtime/router.ts:14:export function navigate(hashRoute: string) {
app/src/runtime/router.ts:68:    if (btn) btn.addEventListener("click", () => navigate("#/login"));
app/src/__tests__/no-direct-location-hash.contract.test.ts:10:  it("no direct location.hash writes in critical modules (use navigate())", () => {
app/src/core/layout/cpToolboxShell.ts:373:        actionBtn.onclick = () => navigate("#/verification");
app/src/core/layout/cpToolboxShell.ts:405:  const currentHash = getCurrentHash() || "#/dashboard";
app/src/core/layout/cpToolboxShell.ts:433:      navigate(item.hash);
app/src/core/layout/cpToolboxShell.ts:501:    navigate("#/account");
app/src/core/layout/cpToolboxShell.ts:540:    navigate("#/login");
app/src/core/layout/cpToolboxShell.ts:574:    navigate("#/settings");
app/src/localAuth.ts:381:    navigate("#/dashboard");
app/src/core/ui/commandPalette.ts:417:      navigate(item.hash);
app/src/core/ui/pageState.ts:128:      logsBtn.onclick = () => navigate("#/management");
app/src/core/ui/toast.ts:91:      navigate("#/logs");
app/src/core/ui/uiBlocks.ts:180:  navigate(target);
app/src/core/ui/uiBlocks.ts:378:  navigate(target);

## CP entrypoints
app/src/pages/cp/sessions.ts:18:export function renderSessions(root: HTMLElement): void {
app/src/pages/cp/system.ts:46:export function renderSystemPage(root: HTMLElement): void {
app/src/pages/cp/backup.ts:17:export function renderBackup(root: HTMLElement): void {
app/src/pages/cp/views/system.ts:13:export function renderSystemSafeModeCp(host: HTMLElement, model: SystemModelCp): void {
app/src/pages/cp/views/users.ts:87:export function renderUsersListCp(root: HTMLElement, model: UsersModelCp): void {
app/src/pages/cp/subscription.ts:68:export function renderSubscriptionPage(root: HTMLElement): void {
app/src/pages/cp/users.ts:17:export function renderUsers(root: HTMLElement): void {
app/src/pages/cp/organization.ts:1974:export function renderOrganization(root: HTMLElement): void {
app/src/pages/cp/twoFactor.ts:16:export function renderTwoFactor(root: HTMLElement): void {
app/src/pages/cp/dashboard.ts:57:export function renderDashboard(root: HTMLElement): void {
app/src/pages/cp/api.ts:51:export function renderApiPage(root: HTMLElement): void {
app/src/pages/cp/featureFlags.ts:15:export function renderFeatureFlags(root: HTMLElement): void {
app/src/pages/cp/settings.ts:22:export function renderSettingsPage(root: HTMLElement): void {
app/src/pages/cp/network.ts:63:export function renderNetworkPage(root: HTMLElement): void {
app/src/pages/cp/management.ts:15:export function renderManagement(root: HTMLElement): void {
app/src/pages/cp/login.ts:22:export function renderLogin(root: HTMLElement): void {
app/src/pages/cp/account.ts:63:export function renderAccountPage(root: HTMLElement): void {

## page->page imports
app/src/moduleLoader.ts:16:import { renderLogin as renderLoginCp } from "./pages/cp/login";
app/src/moduleLoader.ts:17:import { renderDashboard as renderDashboardCp } from "./pages/cp/dashboard";
app/src/moduleLoader.ts:18:import { renderSystemPage as renderSystemPageCp } from "./pages/cp/system";
app/src/moduleLoader.ts:19:import { renderSettingsPage as renderSettingsPageCp } from "./pages/cp/settings";
app/src/moduleLoader.ts:20:import { renderUsers as renderUsersCp } from "./pages/cp/users";
app/src/moduleLoader.ts:21:import { renderAccountPage as renderAccountCp } from "./pages/cp/account";
app/src/moduleLoader.ts:22:import { renderManagement as renderManagementCp } from "./pages/cp/management";
app/src/moduleLoader.ts:23:import { renderSubscriptionPage as renderSubscriptionCp } from "./pages/cp/subscription";
app/src/moduleLoader.ts:24:import { renderOrganization as renderOrganizationCp } from "./pages/cp/organization";
app/src/moduleLoader.ts:25:import { renderTwoFactor } from "./pages/cp/twoFactor";
app/src/moduleLoader.ts:26:import { renderSessions } from "./pages/cp/sessions";
app/src/moduleLoader.ts:27:import { renderBackup } from "./pages/cp/backup";
app/src/moduleLoader.ts:28:import { renderFeatureFlags } from "./pages/cp/featureFlags";
app/src/moduleLoader.ts:29:import { renderApiPage } from "./pages/cp/api";
app/src/moduleLoader.ts:30:import { renderNetworkPage } from "./pages/cp/network";

## build:cp
vite v7.3.1 building client environment for production...
transforming...
✓ 186 modules transformed.
rendering chunks...
computing gzip size...
dist/cp/index.html                                    0.99 kB │ gzip:  0.52 kB
dist/cp/assets/index-65vfgkbG.css                    16.45 kB │ gzip:  3.74 kB
dist/cp/assets/storageNs-DVJrbGxk.js                  0.10 kB │ gzip:  0.11 kB
dist/cp/assets/contract-0P8mHXTX.js                   0.10 kB │ gzip:  0.12 kB
dist/cp/assets/auditLog-uHzrHQny.js                   0.28 kB │ gzip:  0.23 kB
dist/cp/assets/storage-D1chLAOB.js                    1.24 kB │ gzip:  0.60 kB
dist/cp/assets/systemHealth-CqlTUVsX.js               1.50 kB │ gzip:  0.74 kB
dist/cp/assets/index-B1hKewhp.js                      1.69 kB │ gzip:  0.71 kB
dist/cp/assets/pageModificationManager-BihmRwW3.js    2.39 kB │ gzip:  1.09 kB
dist/cp/assets/index-CwBmg_dX.js                      3.69 kB │ gzip:  1.46 kB
dist/cp/assets/index-DCn_xYJd.js                      8.09 kB │ gzip:  3.16 kB
dist/cp/assets/index-DCi6lXM_.js                      9.28 kB │ gzip:  3.59 kB
dist/cp/assets/entitlements-Ck-Xf1tx.js               9.35 kB │ gzip:  3.52 kB
dist/cp/assets/index-BdntCqyJ.js                      9.42 kB │ gzip:  3.48 kB
dist/cp/assets/runtime-smoke-0CVwL4_8.js              9.83 kB │ gzip:  3.50 kB
dist/cp/assets/index-crpFvqlm.js                     15.91 kB │ gzip:  5.25 kB
dist/cp/assets/index-bJyBwL6Z.js                    385.26 kB │ gzip: 93.50 kB
✓ built in 383ms

## proofs:dashboard
[OK] CP dashboard route proofs check passed
