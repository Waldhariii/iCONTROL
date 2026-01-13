import type { RouteId } from "./router";

// Import module pages (single source of truth)
import { renderLogin } from "../../modules/core-system/ui/frontend-ts/pages/login";
import { renderDashboard } from "../../modules/core-system/ui/frontend-ts/pages/dashboard";
import { renderSettingsPage } from "../../modules/core-system/ui/frontend-ts/pages/settings";
import { renderBrandingSettings } from "../../modules/core-system/ui/frontend-ts/pages/settings/branding";
import { canAccessToolbox } from "./runtime/rbac";

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
          console.warn("WARN_ROUTE_IMPORT_FAILED", { spec: "./pages/runtime-smoke", err: String(e) });
        });
      return;
    }
  } catch (e) {
    console.warn("WARN_RUNTIME_SMOKE_ROUTE", String(e));
  }

  try {
    if ((rid as any) === "users") {
      import("../../modules/core-system/ui/frontend-ts/pages/users")
        .then((m) => m.renderUsers(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/users",
            err: String(e)
          });
        });
      return;
    }
    if ((rid as any) === "account") {
      import("../../modules/core-system/ui/frontend-ts/pages/account")
        .then((m) => m.renderAccount(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/account",
            err: String(e)
          });
        });
      return;
    }
    if ((rid as any) === "dossiers") {
      import("../../modules/core-system/ui/frontend-ts/pages/dossiers")
        .then((m) => m.renderDossiersPage(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/dossiers",
            err: String(e)
          });
        });
      return;
    }
    if ((rid as any) === "developer") {
      import("../../modules/core-system/ui/frontend-ts/pages/developer")
        .then((m) => m.renderDeveloper(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/developer",
            err: String(e)
          });
        });
      return;
    }
    if ((rid as any) === "developer_entitlements") {
      import("../../modules/core-system/ui/frontend-ts/pages/developer/entitlements")
        .then((m) => m.renderDeveloperEntitlements(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/developer/entitlements",
            err: String(e)
          });
        });
      return;
    }
    if ((rid as any) === "access_denied") {
      import("../../modules/core-system/ui/frontend-ts/pages/access-denied")
        .then((m) => m.renderAccessDeniedPage(root, { entitlement: getEntitlementFromHash() }))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED"
  // Activation / licence
  if (hash.startsWith("#/activation")) {
    const m = await import("/modules/core-system/ui/frontend-ts/pages/activation/index");
    return m.renderActivationPage(mount);
  }
, {
            spec: "../../modules/core-system/ui/frontend-ts/pages/access-denied",
            err: String(e)
          });
        });
      return;
    }
    if ((rid as any) === "verification") {
      import("../../modules/core-system/ui/frontend-ts/pages/verification")
        .then((m) => m.renderVerification(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/verification",
            err: String(e)
          });
        });
      return;
    }
    if ((rid as any) === "system") {
      import("../../modules/core-system/ui/frontend-ts/pages/system")
        .then((m) => m.renderSystemPage(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/system",
            err: String(e)
          });
        });
      return;
    }
    if ((rid as any) === "logs") {
      import("../../modules/core-system/ui/frontend-ts/pages/logs")
        .then((m) => m.renderLogsPage(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/logs",
            err: String(e)
          });
        });
      return;
    }
    if ((rid as any) === "toolbox") {
      if (!canAccessToolbox()) {
        root.innerHTML = "<div style=\"padding:12px;opacity:0.9;\"><h2 style=\"margin:0 0 8px 0;\">Access denied</h2><div>Toolbox requires elevated role.</div></div>";
        return;
      }
      import("../../modules/core-system/ui/frontend-ts/pages/toolbox")
        .then((m) => m.renderToolbox(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/toolbox",
            err: String(e)
          });
        });
      return;
    }
  } catch (e) {
    console.warn("WARN_MAIN_SYSTEM_ROUTE", String(e));
  }

  if (rid === "login") return renderLogin(root);
  if (rid === "dashboard") return renderDashboard(root);
  if (rid === "settings") return renderSettingsPage(root);
  if (rid === "settings_branding") return renderBrandingSettings(root);

  root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page introuvable.</div>`;
}
