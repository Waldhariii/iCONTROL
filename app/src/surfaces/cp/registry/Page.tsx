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
const renderNotFound = async (root: HTMLElement) => {
  const m = await import("../notfound/Page");
  m.renderNotFoundCp(root);
};

export const CP_PAGES_REGISTRY: Record<string, PageRegistryEntry> = {
  home_cp: {
    routeId: "home_cp" as RouteId,
    render: async (root) => {
      const m = await import("../home-cp/Page");
      m.renderHomeCp(root);
    },
    async: true,
  },
  dashboard_cp: {
    routeId: "dashboard_cp" as RouteId,
    render: async (root) => {
      const m = await import("../dashboard/Page");
      m.renderDashboard(root);
    },
    async: true,
  },
  pages_cp: {
    routeId: "pages_cp" as RouteId,
    render: async (root) => {
      const m = await import("../pages/Page");
      m.renderPages(root);
    },
    async: true,
  },
  login_theme_cp: {
    routeId: "login_theme_cp" as RouteId,
    render: async (root) => {
      const m = await import("../login-theme/Page");
      const render = (m as any).render || (m as any).default?.render;
      if (typeof render === "function") render(root);
      else await renderNotFound(root);
    },
    async: true,
  },
  access_denied_cp: {
    routeId: "access_denied_cp" as RouteId,
    render: renderNotFound,
    async: true,
  },
  blocked_cp: {
    routeId: "blocked_cp" as RouteId,
    render: renderNotFound,
    async: true,
  },
  notfound_cp: {
    routeId: "notfound_cp" as RouteId,
    render: renderNotFound,
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
