/**
 * ICONTROL_APP_PAGES_REGISTRY_V1
 * Registry des pages pour l'application CLIENT (/app)
 * 
 * Principe: Toutes les pages APP sont enregistrées ici.
 * Le moduleLoader route vers cette registry quand VITE_APP_KIND=CLIENT_APP
 */

import type { RouteId } from "../../router";

// Import des pages APP depuis modules/ (pages métier utilisateur)
import { renderLogin } from "../../../modules/core-system/ui/frontend-ts/pages/login";
import { renderDashboard } from "../../../modules/core-system/ui/frontend-ts/pages/dashboard";
import { renderSettingsPage } from "../../../modules/core-system/ui/frontend-ts/pages/settings";
import { renderBrandingSettings } from "../../../modules/core-system/ui/frontend-ts/pages/settings/branding";

export type PageRenderer = (root: HTMLElement) => void | Promise<void>;

export interface PageRegistryEntry {
  routeId: RouteId;
  render: PageRenderer;
  async?: boolean;
}

/**
 * Registry des pages APP (Client)
 * 
 * Règle: Ces pages sont pour les utilisateurs finaux (workflows métier, exécution opérationnelle)
 */
export const APP_PAGES_REGISTRY: Record<RouteId, PageRegistryEntry> = {
  login: {
    routeId: "login",
    render: renderLogin,
  },
  dashboard: {
    routeId: "dashboard",
    render: renderDashboard,
  },
  settings: {
    routeId: "settings",
    render: renderSettingsPage,
  },
  settings_branding: {
    routeId: "settings_branding",
    render: renderBrandingSettings,
  },
  // Pages dynamiques (importées à la demande)
  users: {
    routeId: "users",
    render: async (root) => {
      const m = await import("../../../modules/core-system/ui/frontend-ts/pages/users");
      m.renderUsers(root);
    },
    async: true,
  },
  account: {
    routeId: "account",
    render: async (root) => {
      const m = await import("../../../modules/core-system/ui/frontend-ts/pages/account");
      m.renderAccount(root);
    },
    async: true,
  },
  dossiers: {
    routeId: "dossiers",
    render: async (root) => {
      const m = await import("../../../modules/core-system/ui/frontend-ts/pages/dossiers");
      m.renderDossiersPage(root);
    },
    async: true,
  },
  developer: {
    routeId: "developer",
    render: async (root) => {
      const m = await import("../../../modules/core-system/ui/frontend-ts/pages/developer");
      m.renderDeveloper(root);
    },
    async: true,
  },
  developer_entitlements: {
    routeId: "developer_entitlements",
    render: async (root) => {
      const m = await import("../../../modules/core-system/ui/frontend-ts/pages/developer/entitlements");
      m.renderDeveloperEntitlements(root);
    },
    async: true,
  },
  access_denied: {
    routeId: "access_denied",
    render: async (root) => {
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
      const m = await import("../../../modules/core-system/ui/frontend-ts/pages/access-denied");
      m.renderAccessDeniedPage(root, {
        entitlement: getEntitlementFromHash(),
      });
    },
    async: true,
  },
  verification: {
    routeId: "verification",
    render: async (root) => {
      const m = await import("../../../modules/core-system/ui/frontend-ts/pages/verification");
      m.renderVerification(root);
    },
    async: true,
  },
  system: {
    routeId: "system",
    render: async (root) => {
      const m = await import("../../../modules/core-system/ui/frontend-ts/pages/system");
      m.renderSystemPage(root);
    },
    async: true,
  },
  logs: {
    routeId: "logs",
    render: async (root) => {
      const m = await import("../../../modules/core-system/ui/frontend-ts/pages/logs");
      m.renderLogsPage(root);
    },
    async: true,
  },
  toolbox: {
    routeId: "toolbox",
    render: async (root) => {
      const { canAccessToolbox } = await import("../../runtime/rbac");
      if (!canAccessToolbox()) {
        root.innerHTML =
          '<div style="padding:12px;opacity:0.9;"><h2 style="margin:0 0 8px 0;">Access denied</h2><div>Toolbox requires elevated role.</div></div>';
        return;
      }
      const m = await import("../../../modules/core-system/ui/frontend-ts/pages/toolbox");
      m.renderToolbox(root);
    },
    async: true,
  },
  blocked: {
    routeId: "blocked",
    render: async (root) => {
      const m = await import("../../../modules/core-system/ui/frontend-ts/pages/blocked");
      m.renderBlockedPage(root);
    },
    async: true,
  },
  notfound: {
    routeId: "notfound",
    render: (root) => {
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page introuvable.</div>`;
    },
  },
  runtime_smoke: {
    routeId: "runtime_smoke",
    render: async (root) => {
      const m = await import("../runtime-smoke");
      m.renderRuntimeSmoke(root);
    },
    async: true,
  },
  ui_catalog: {
    routeId: "ui_catalog",
    render: async (root) => {
      const m = await import("./ui-catalog");
      m.renderUiCatalog(root);
    },
    async: true,
  },
};

/**
 * Rendre une page APP par son RouteId
 */
export function renderAppPage(routeId: RouteId, root: HTMLElement): void {
  const entry = APP_PAGES_REGISTRY[routeId];
  if (!entry) {
    // Fallback vers notfound
    APP_PAGES_REGISTRY.notfound.render(root);
    return;
  }

  try {
    if (entry.async) {
      // Pages async : utiliser then/catch pour gérer les erreurs
      (entry.render(root) as Promise<void>).catch((e) => {
        console.warn("WARN_ROUTE_IMPORT_FAILED", {
          routeId,
          err: String(e),
        });
        APP_PAGES_REGISTRY.notfound.render(root);
      });
    } else {
      // Pages sync
      entry.render(root);
    }
  } catch (e) {
    console.warn("WARN_ROUTE_RENDER_FAILED", {
      routeId,
      err: String(e),
    });
    APP_PAGES_REGISTRY.notfound.render(root);
  }
}
