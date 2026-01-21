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
      // CP utilise le même login mais avec scope CP
      const m = await import("../../../../modules/core-system/ui/frontend-ts/pages/login");
      m.renderLogin(root);
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
      try {
        const m = await import("./subscription");
        // Vérifier si la fonction existe
        if (typeof m.renderSubscription === "function") {
          m.renderSubscription(root);
        } else {
          // Fallback si fonction non exportée
          root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page Subscription (en cours d'implémentation).</div>`;
        }
      } catch (e) {
        console.warn("WARN_SUBSCRIPTION_PAGE_IMPORT_FAILED", String(e));
        root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page Subscription (erreur de chargement).</div>`;
      }
    },
    async: true,
  },
  // Pages CP spécifiques (à créer)
  tenants: {
    routeId: "tenants" as RouteId,
    render: async (root) => {
      // Page CP Tenants (implémentée avec composants visuels APP)
      const m = await import("./tenants");
      await m.renderTenants(root);
    },
    async: true,
  },
  entitlements: {
    routeId: "entitlements" as RouteId,
    render: async (root) => {
      // Page CP Entitlements (implémentée avec composants visuels APP)
      const m = await import("./entitlements");
      await m.renderEntitlements(root);
    },
    async: true,
  },
  pages: {
    routeId: "pages" as RouteId,
    render: async (root) => {
      // Page CP Pages Registry (implémentée avec composants visuels APP)
      const m = await import("./pages");
      await m.renderPages(root);
    },
    async: true,
  },
  "feature-flags": {
    routeId: "feature-flags" as RouteId,
    render: async (root) => {
      // Page CP Feature Flags (implémentée avec composants visuels APP)
      const m = await import("./feature-flags");
      await m.renderFeatureFlags(root);
    },
    async: true,
  },
  publish: {
    routeId: "publish" as RouteId,
    render: async (root) => {
      // Page CP Publish Center (implémentée avec composants visuels APP)
      const m = await import("./publish");
      await m.renderPublish(root);
    },
    async: true,
  },
  audit: {
    routeId: "audit" as RouteId,
    render: async (root) => {
      // TODO: Créer app/src/pages/cp/audit.ts
      root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page Audit/Observability (à implémenter).</div>`;
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
