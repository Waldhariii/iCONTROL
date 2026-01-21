/**
 * ICONTROL_CP_PAGES_REGISTRY_V1
 * Registry des pages pour l'application CONTROL PLANE (/cp)
 * 
 * Principe: Toutes les pages CP sont enregistrées ici.
 * Le moduleLoader route vers cette registry quand VITE_APP_KIND=CONTROL_PLANE
 * 
 * IMPORTANT: Ces pages sont pour la gouvernance, le pilotage, la configuration.
 * Elles NE SONT PAS des copies des pages APP.
 */

import type { RouteId } from "../../router";

export type PageRenderer = (root: HTMLElement) => void | Promise<void>;

export interface PageRegistryEntry {
  routeId: RouteId;
  render: PageRenderer;
  async?: boolean;
}

/**
 * Registry des pages CP (Control Plane)
 * 
 * Règle: Ces pages sont pour l'administration (pilotage, gouvernance, configuration, supervision)
 */
export const CP_PAGES_REGISTRY: Record<string, PageRegistryEntry> = {
  login: {
    routeId: "login",
    render: async (root) => {
      const m = await import("./login");
      m.renderCpLogin(root);
    },
    async: true,
  },
  dashboard: {
    routeId: "dashboard",
    render: async (root) => {
      // Page CP dashboard (différente de APP dashboard)
      const m = await import("./dashboard");
      m.renderDashboard(root);
    },
    async: true,
  },
  system: {
    routeId: "system",
    render: async (root) => {
      // Page CP system (différente de APP system)
      const m = await import("./system");
      m.renderSystemPage(root);
    },
    async: true,
  },
  users: {
    routeId: "users",
    render: async (root) => {
      // Page CP users (différente de APP users)
      const m = await import("./users");
      m.renderUsers(root);
    },
    async: true,
  },
  subscription: {
    routeId: "subscription" as RouteId,
    render: async (root) => {
      // Page CP subscription (gestion abonnements)
      const m = await import("./subscription");
      m.renderSubscription(root);
    },
    async: true,
  },
  // Pages CP spécifiques (à créer)
  tenants: {
    routeId: "tenants" as RouteId,
    render: async (root) => {
      // Page CP Tenants (composants visuels core)
      const m = await import("./tenants");
      await m.renderTenants(root);
    },
    async: true,
  },
  entitlements: {
    routeId: "entitlements" as RouteId,
    render: async (root) => {
      // Page CP Entitlements (composants visuels core)
      const m = await import("./entitlements");
      await m.renderEntitlements(root);
    },
    async: true,
  },
  pages: {
    routeId: "pages" as RouteId,
    render: async (root) => {
      // Page CP Pages Registry (composants visuels core)
      const m = await import("./pages");
      await m.renderPages(root);
    },
    async: true,
  },
  "feature-flags": {
    routeId: "feature-flags" as RouteId,
    render: async (root) => {
      // Page CP Feature Flags (composants visuels core)
      const m = await import("./feature-flags");
      await m.renderFeatureFlags(root);
    },
    async: true,
  },
  publish: {
    routeId: "publish" as RouteId,
    render: async (root) => {
      // Page CP Publish Center (composants visuels core)
      const m = await import("./publish");
      await m.renderPublish(root);
    },
    async: true,
  },
  "login-theme": {
    routeId: "login-theme" as RouteId,
    render: async (root) => {
      const m = await import("./login-theme");
      m.renderLoginThemeEditor(root);
    },
    async: true,
  },
  audit: {
    routeId: "audit" as RouteId,
    render: async (root) => {
      const m = await import("./audit");
      m.renderAudit(root);
    },
    async: true,
  },
  integrations: {
    routeId: "integrations" as RouteId,
    render: async (root) => {
      const m = await import("./integrations");
      m.renderIntegrations(root);
    },
    async: true,
  },
  access_denied: {
    routeId: "access_denied",
    render: async (root) => {
      const m = await import("./access-denied");
      m.renderAccessDeniedCp(root);
    },
    async: true,
  },
  blocked: {
    routeId: "blocked",
    render: async (root) => {
      const m = await import("./blocked");
      m.renderBlockedCp(root);
    },
    async: true,
  },
  notfound: {
    routeId: "notfound",
    render: async (root) => {
      const m = await import("./notfound");
      m.renderNotFoundCp(root);
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
 * Rendre une page CP par son RouteId
 */
export function renderCpPage(routeId: RouteId, root: HTMLElement): void {
  const entry = CP_PAGES_REGISTRY[routeId] || CP_PAGES_REGISTRY[String(routeId)];
  if (!entry) {
    // Fallback vers notfound
    CP_PAGES_REGISTRY.notfound.render(root);
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
        CP_PAGES_REGISTRY.notfound.render(root);
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
    CP_PAGES_REGISTRY.notfound.render(root);
  }
}
