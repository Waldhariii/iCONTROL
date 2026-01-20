import type { RouteId } from "./router";
import { getAppKind } from "./pages/appContext";
import { canAccessPageRoute } from "./runtime/rbac";
import { debugLog, warnLog } from "./core/utils/logger";
import { getSession } from "./localAuth";

// Import APP pages (client)
import { renderLogin as renderLoginApp } from "./pages/app/login";
import { renderDashboard as renderDashboardApp } from "./pages/app/dashboard";
import { renderSystemPage as renderSystemPageApp } from "./pages/app/system";
import { renderSettingsPage as renderSettingsPageApp } from "./pages/app/settings";
import { renderUsers as renderUsersApp } from "./pages/app/users";
import { renderAccount as renderAccountApp } from "./pages/app/account";

// Import CP pages (administration)
import { renderLoginPage as renderLoginCp } from "./pages/cp/login";
import { renderDashboardPage as renderDashboardCp } from "./pages/cp/dashboard";
import { renderSystemPage as renderSystemPageCp } from "./pages/cp/system";
import { renderSettingsPage as renderSettingsPageCp } from "./pages/cp/settings";
import { renderUsersPage as renderUsersCp } from "./pages/cp/users";
import { renderAccountPage as renderAccountCp } from "./pages/cp/account";
import { renderManagementPage as renderManagementCp } from "./pages/cp/management";
import { renderSubscriptionPage as renderSubscriptionCp } from "./pages/cp/subscription";
import { renderOrganizationPage as renderOrganizationCp } from "./pages/cp/organization";
import { renderTwoFactorPage as renderTwoFactorCp } from "./pages/cp/twoFactor";
import { renderSessionsPage as renderSessionsCp } from "./pages/cp/sessions";
import { renderBackupPage as renderBackupCp } from "./pages/cp/backup";
import { renderFeatureFlagsPage as renderFeatureFlagsCp } from "./pages/cp/featureFlags";
import { renderApiPage as renderApiCp } from "./pages/cp/api";
import { renderNetworkPage as renderNetworkCp } from "./pages/cp/network";

export function renderRoute(rid: RouteId, root: HTMLElement): void {
  const getEntitlementFromHash = (): string => {
    const h = String(location.hash || "");
    const idx = h.indexOf("?");
    if (idx === -1) return "";
    const qs = h.slice(idx + 1);
    try {
      return new URLSearchParams(qs).get("entitlement") || "";
    } catch {
      return "";
    }
  };

  // RUNTIME_SMOKE_ROUTE_V2
  try {
    if ((rid as any) === "runtime_smoke") {
      import("./pages/runtime-smoke")
        .then((m) => m.renderRuntimeSmoke(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          warnLog("WARN_ROUTE_IMPORT_FAILED", {
            spec: "./pages/runtime-smoke",
            err: String(e),
          });
        });
      return;
    }
  } catch (e) {
    warnLog("WARN_RUNTIME_SMOKE_ROUTE", String(e));
  }

  try {
    if ((rid as any) === "users") {
      if (!canAccessPageRoute("users")) {
        root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Accès refusé à cette page.</div>`;
        return;
      }
      const appKind = getAppKind();
      if (appKind === "CP") {
        renderUsersCp(root);
      } else {
        renderUsersApp(root);
      }
      return;
    }
    if ((rid as any) === "account") {
      if (!canAccessPageRoute("account")) {
        root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Accès refusé à cette page.</div>`;
        return;
      }
      const appKind = getAppKind();
      if (appKind === "CP") {
        renderAccountCp(root);
      } else {
        renderAccountApp(root);
      }
      return;
    }
    // ICONTROL_APP_CP_ROUTE_GUARDS_V1: Routes restreintes par application
    if ((rid as any) === "dossiers") {
      // Dossiers: APP uniquement (client)
      const appKind = getAppKind();
      if (appKind !== "APP") {
        root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application administration.</div>`;
        return;
      }
      import("../../modules/core-system/ui/frontend-ts/pages/dossiers")
        .then((m) => m.renderDossiersPage(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          warnLog("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/dossiers",
            err: String(e),
          });
        });
      return;
    }
    if ((rid as any) === "developer") {
      // Developer: CP uniquement (administration)
      const appKind = getAppKind();
      if (appKind !== "CP") {
        root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application client.</div>`;
        return;
      }
      import("../../modules/core-system/ui/frontend-ts/pages/developer")
        .then((m) => m.renderDeveloper(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          warnLog("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/developer",
            err: String(e),
          });
        });
      return;
    }
    if ((rid as any) === "developer_entitlements") {
      // Developer Entitlements: CP uniquement (administration)
      const appKind = getAppKind();
      if (appKind !== "CP") {
        root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application client.</div>`;
        return;
      }
      import("../../modules/core-system/ui/frontend-ts/pages/developer/entitlements")
        .then((m) => m.renderDeveloperEntitlements(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/developer/entitlements",
            err: String(e),
          });
        });
      return;
    }
    if ((rid as any) === "access_denied") {
      import("../../modules/core-system/ui/frontend-ts/pages/access-denied")
        .then((m) =>
          m.renderAccessDeniedPage(root, {
            entitlement: getEntitlementFromHash(),
          }),
        )
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/access-denied",
            err: String(e),
          });
        });
      return;
    }
    // Activation / licence
    const hash = String(location.hash || "");
    if (hash.startsWith("#/activation")) {
      import("../../modules/core-system/ui/frontend-ts/pages/activation").then(
        (m) => m.renderActivationPage(root),
      );
      return;
    }
    if ((rid as any) === "verification") {
      // Verification: CP uniquement (administration)
      const appKind = getAppKind();
      if (appKind !== "CP") {
        root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application client.</div>`;
        return;
      }
      import("../../modules/core-system/ui/frontend-ts/pages/verification")
        .then((m) => m.renderVerification(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/verification",
            err: String(e),
          });
        });
      return;
    }
    if ((rid as any) === "system") {
      const appKind = getAppKind();
      if (appKind === "CP") {
        renderSystemPageCp(root);
      } else {
        renderSystemPageApp(root);
      }
      return;
    }
    if ((rid as any) === "logs") {
      // Logs: CP uniquement (administration)
      const appKind = getAppKind();
      if (appKind !== "CP") {
        root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application client.</div>`;
        return;
      }
      import("../../modules/core-system/ui/frontend-ts/pages/logs")
        .then((m) => m.renderLogsPage(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/logs",
            err: String(e),
          });
        });
      return;
    }
    if ((rid as any) === "api") {
      // API: CP uniquement (administration)
      const appKind = getAppKind();
      if (appKind !== "CP") {
        root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application client.</div>`;
        return;
      }
      renderApiCp(root);
      return;
    }
    if ((rid as any) === "network") {
      // Network: CP uniquement (administration)
      const appKind = getAppKind();
      if (appKind !== "CP") {
        root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application client.</div>`;
        return;
      }
      renderNetworkCp(root);
      return;
    }
  } catch (e) {
    warnLog("WARN_MAIN_SYSTEM_ROUTE", String(e));
  }

  // ICONTROL_APP_CP_ROUTING_V1: Router vers les pages appropriées selon le contexte
  const appKind = getAppKind();

  if (rid === "login") {
    debugLog("🔵 moduleLoader: login route", { appKind, rootId: root.id });
    const result = appKind === "CP" ? renderLoginCp(root) : renderLoginApp(root);
    debugLog("✅ moduleLoader: login rendu", { length: root.innerHTML?.length || 0 });
    return result;
  }
  if (rid === "dashboard") {
    if (!canAccessPageRoute("dashboard")) {
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Accès refusé à cette page.</div>`;
      return;
    }
    return appKind === "CP" ? renderDashboardCp(root) : renderDashboardApp(root);
  }
  if (rid === "settings") {
    if (!canAccessPageRoute("settings")) {
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Accès refusé à cette page.</div>`;
      return;
    }
    return appKind === "CP" ? renderSettingsPageCp(root) : renderSettingsPageApp(root);
  }
  if (rid === "management") {
    // Management: CP uniquement (administration)
    const appKind = getAppKind();
    if (appKind !== "CP") {
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application client.</div>`;
      return;
    }
    if (!canAccessPageRoute("management")) {
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Accès refusé à cette page.</div>`;
      return;
    }
    return renderManagementCp(root);
  }
  if (rid === "subscription") {
    // Subscription: CP uniquement (administration)
    const appKind = getAppKind();
    if (appKind !== "CP") {
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application client.</div>`;
      return;
    }
    if (!canAccessPageRoute("settings")) {
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Accès refusé à cette page.</div>`;
      return;
    }
    return renderSubscriptionCp(root);
  }
  if (rid === "organization") {
    // Organization: CP uniquement (administration)
    const appKind = getAppKind();
    if (appKind !== "CP") {
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application client.</div>`;
      return;
    }
    if (!canAccessPageRoute("settings")) {
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Accès refusé à cette page.</div>`;
      return;
    }
    return renderOrganizationCp(root);
  }
  if (rid === "twofactor") {
    const appKind = getAppKind();
    if (appKind !== "CP") {
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application client.</div>`;
      return;
    }
    return renderTwoFactorCp(root);
  }
  if (rid === "sessions") {
    const appKind = getAppKind();
    if (appKind !== "CP") {
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application client.</div>`;
      return;
    }
    return renderSessionsCp(root);
  }
  if (rid === "backup") {
    const appKind = getAppKind();
    if (appKind !== "CP") {
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application client.</div>`;
      return;
    }
    return renderBackupCp(root);
  }
  if (rid === "featureflags") {
    const appKind = getAppKind();
    if (appKind !== "CP") {
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application client.</div>`;
      return;
    }
    return renderFeatureFlagsCp(root);
  }

  root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page introuvable.</div>`;
}
