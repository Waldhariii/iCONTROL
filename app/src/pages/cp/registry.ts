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
  home_cp: {
    routeId: "home_cp" as RouteId,
    render: async (root) => {
      const m = await import("./home-cp");
      m.renderHomeCp(root);
    },
    async: true,
  },
  dashboard_cp: {
    routeId: "dashboard_cp" as RouteId,
    render: async (root) => {
      // Page CP dashboard (différente de APP dashboard)
      const m = await import("./dashboard");
      m.renderDashboard(root);
    },
    async: true,
  },
  subscription_cp: {
    routeId: "subscription_cp" as RouteId,
    render: async (root) => {
      // Page CP subscription (gestion abonnements)
      const m = await import("./subscription");
      m.renderSubscription(root);
    },
    async: true,
  },
  // Pages CP spécifiques (à créer)
  tenants_cp: {
    routeId: "tenants_cp" as RouteId,
    render: async (root) => {
      // Page CP Tenants (composants visuels core)
      const m = await import("./tenants");
      await m.renderTenants(root);
    },
    async: true,
  },
  entitlements_cp: {
    routeId: "entitlements_cp" as RouteId,
    render: async (root) => {
      // Page CP Entitlements (composants visuels core)
      const m = await import("./entitlements");
      await m.renderEntitlements(root);
    },
    async: true,
  },
  pages_cp: {
    routeId: "pages_cp" as RouteId,
    render: async (root) => {
      // Page CP Pages Registry (composants visuels core)
      const m = await import("./pages");
      await m.renderPages(root);
    },
    async: true,
  },
  "feature-flags_cp": {
    routeId: "feature-flags_cp" as RouteId,
    render: async (root) => {
      // Page CP Feature Flags (composants visuels core)
      const m = await import("./feature-flags");
      await m.renderFeatureFlags(root);
    },
    async: true,
  },
  publish_cp: {
    routeId: "publish_cp" as RouteId,
    render: async (root) => {
      // Page CP Publish Center (composants visuels core)
      const m = await import("./publish");
      await m.renderPublish(root);
    },
    async: true,
  },
  audit_cp: {
    routeId: "audit_cp" as RouteId,
    render: async (root) => {
      const m = await import("./audit");
      m.renderAudit(root);
    },
    async: true,
  },
  integrations_cp: {
    routeId: "integrations_cp" as RouteId,
    render: async (root) => {
      const m = await import("./integrations");
      m.renderIntegrations(root);
    },
    async: true,
  },
  access_denied_cp: {
    routeId: "access_denied_cp" as RouteId,
    render: async (root) => {
      const m = await import("./access-denied");
      m.renderAccessDeniedCp(root);
    },
    async: true,
  },
  blocked_cp: {
    routeId: "blocked_cp" as RouteId,
    render: async (root) => {
      const m = await import("./blocked");
      m.renderBlockedCp(root);
    },
    async: true,
  },
  notfound_cp: {
    routeId: "notfound_cp" as RouteId,
    render: async (root) => {
      const m = await import("./notfound");
      m.renderNotFoundCp(root);
    },
    async: true,
  },
  ui_catalog_cp: {
    routeId: "ui_catalog_cp" as RouteId,
    render: async (root) => {
      const m = await import("./notfound") /* legacy ui-catalog disabled: SSOT-only */;
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
    // Fallback vers notfound_cp
    CP_PAGES_REGISTRY.notfound_cp.render(root);
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
        CP_PAGES_REGISTRY.notfound_cp.render(root);
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
    CP_PAGES_REGISTRY.notfound_cp.render(root);
  }
}
