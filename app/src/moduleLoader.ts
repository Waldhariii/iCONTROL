import type { RouteId } from "./router";
import { resolveAppKind } from "./runtime/appKind";

// NOTE: Removed shared module imports - APP and CP are now completely separated
// CP uses CP_PAGES_REGISTRY, APP uses APP_PAGES_REGISTRY
// No shared routable pages from modules/core-system
import { canAccessToolbox } from "./runtime/rbac";

export function renderRoute(rid: RouteId, root: HTMLElement): void {
  const failSafe = (err: unknown) => {
    try {
      root.innerHTML = `<div style="padding:16px;text-align:center;font:14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:var(--text, var(--text-primary));background:var(--bg, var(--bg-app));">Route render failed: ${String(err)}</div>`;
    } catch {
      // ignore
    }
  };
  try {
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

  // RUNTIME_SMOKE_ROUTE_V2 (CP only)
  try {
    if ((rid as any) === "runtime_smoke_cp") {
      import("./pages/runtime-smoke")
        .then((m) => m.renderRuntimeSmoke(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "./pages/runtime-smoke",
            err: String(e),
          });
        });
      return;
    }
  } catch (e) {
    console.warn("WARN_RUNTIME_SMOKE_ROUTE", String(e));
  }

  try {
    if ((rid as any) === "users_cp") {
      import("../../modules/core-system/ui/frontend-ts/pages/users")
        .then((m) => m.renderUsers(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/users",
            err: String(e),
          });
        });
      return;
    }
    if ((rid as any) === "account_cp") {
      import("../../modules/core-system/ui/frontend-ts/pages/account")
        .then((m) => m.renderAccount(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/account",
            err: String(e),
          });
        });
      return;
    }
    if ((rid as any) === "dossiers_cp") {
      import("../../modules/core-system/ui/frontend-ts/pages/dossiers")
        .then((m) => m.renderDossiersPage(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/dossiers",
            err: String(e),
          });
        });
      return;
    }
    if ((rid as any) === "developer_cp") {
      import("../../modules/core-system/ui/frontend-ts/pages/developer")
        .then((m) => m.renderDeveloper(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/developer",
            err: String(e),
          });
        });
      return;
    }
    if ((rid as any) === "developer_entitlements_cp") {
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
    if ((rid as any) === "access_denied_cp" || (rid as any) === "access_denied_app") {
      // Access denied: use app-scoped page (no shared pages)
      const kind = resolveAppKind();
      if (kind === "CP") {
        import("./pages/cp/registry").then((m) => m.renderCpPage("access_denied_cp" as RouteId, root)).catch(() => {
          root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Accès refusé.</div>`;
        });
      } else {
        import("./pages/app/registry").then((m) => m.renderAppPage("access_denied_app" as RouteId, root)).catch(() => {
          root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Accès refusé.</div>`;
        });
      }
      return;
    }
    if ((rid as any) === "verification_cp") {
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
    if ((rid as any) === "system_cp") {
      import("../../modules/core-system/ui/frontend-ts/pages/system")
        .then((m) => m.renderSystemPage(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/system",
            err: String(e),
          });
        });
      return;
    }
    if ((rid as any) === "logs_cp") {
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
    if ((rid as any) === "toolbox_cp") {
      if (!canAccessToolbox()) {
        root.innerHTML =
          '<div style="padding:12px;opacity:0.9;"><h2 style="margin:0 0 8px 0;">Access denied</h2><div>Toolbox requires elevated role.</div></div>';
        return;
      }
      import("../../modules/core-system/ui/frontend-ts/pages/toolbox")
        .then((m) => m.renderToolbox(root))
        .catch((e) => {
          /* ICONTROL_LOADER_IMPORT_GUARD_V1 */
          console.warn("WARN_ROUTE_IMPORT_FAILED", {
            spec: "../../modules/core-system/ui/frontend-ts/pages/toolbox",
            err: String(e),
          });
        });
      return;
    }
  } catch (e) {
    console.warn("WARN_MAIN_SYSTEM_ROUTE", String(e));
  }

  // CP fallback: pages du CP_PAGES_REGISTRY (all routes have _cp suffix)
  // APP fallback: pages du APP_PAGES_REGISTRY (all routes have _app suffix)
  // NO SHARED ROUTES - complete separation
  if (resolveAppKind() === "CP") {
    // Ensure routeId has _cp suffix for CP
    const cpRouteId = (rid.endsWith("_cp") ? rid : `${rid}_cp`) as RouteId;
    import("./pages/cp/registry").then((m) => m.renderCpPage(cpRouteId, root)).catch((e) => {
      console.warn("WARN_CP_PAGE_FALLBACK", e);
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page introuvable.</div>`;
    });
    return;
  }

  // APP fallback: pages du APP_PAGES_REGISTRY (all routes have _app suffix)
  if (resolveAppKind() === "APP") {
    // Ensure routeId has _app suffix for APP
    const appRouteId = (rid.endsWith("_app") ? rid : `${rid}_app`) as RouteId;
    import("./pages/app/registry").then((m) => m.renderAppPage(appRouteId, root)).catch((e) => {
      console.warn("WARN_APP_PAGE_FALLBACK", e);
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page introuvable.</div>`;
    });
    return;
  }

  root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page introuvable.</div>`;
  } catch (e) {
    console.warn("WARN_RENDER_ROUTE_FAILED", String(e));
    failSafe(e);
  }
}
