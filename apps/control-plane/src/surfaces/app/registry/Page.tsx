/**
 * ICONTROL_APP_PAGES_REGISTRY_V2
 * Registry minimal pour la surface CLIENT (désactivée).
 *
 * Objectif: n'exposer que des routes de maintenance et une page canonique.
 */

import type { RouteId } from "../../../router";
import { renderClientDisabled } from "../client-disabled/Page";
import { renderClientAccessDenied } from "../client-access-denied/Page";
import { renderClientCatalog } from "../client-catalog/Page";
import { renderAccountApp } from "../account/Page";
import { renderDashboardApp } from "../dashboard/Page";
import { renderClientsApp } from "../clients/Page";
import { renderJobsApp } from "../jobs/Page";
import { renderSettingsApp } from "../settings/Page";
import { renderLoginApp } from "../login/Page";
import { renderGalleryApp } from "../gallery/Page";

export type PageRenderer = (root: HTMLElement) => void | Promise<void>;

export interface PageRegistryEntry {
  routeId: RouteId;
  render: PageRenderer;
  async?: boolean;
}

export const APP_PAGES_REGISTRY: Partial<Record<RouteId, PageRegistryEntry>> = {
  home_app: {
    routeId: "home_app" as RouteId,
    render: async (root) => {
      const m = await import("../home-app/Page");
      m.renderHomeApp(root);
    },
    async: true,
  },
  dashboard_app: {
    routeId: "dashboard_app" as RouteId,
    render: renderDashboardApp,
  },
  login_app: {
    routeId: "login_app" as RouteId,
    render: renderLoginApp,
  },
  account_app: {
    routeId: "account_app" as RouteId,
    render: renderAccountApp,
  },
  settings_app: {
    routeId: "settings_app" as RouteId,
    render: renderSettingsApp,
  },
  clients_app: {
    routeId: "clients_app" as RouteId,
    render: renderClientsApp,
  },
  jobs_app: {
    routeId: "jobs_app" as RouteId,
    render: renderJobsApp,
  },
  registry_app: {
    routeId: "registry_app" as RouteId,
    render: renderRegistryApp,
  },
  gallery_app: {
    routeId: "gallery_app" as RouteId,
    render: renderGalleryApp,
  },
  client_disabled_app: {
    routeId: "client_disabled_app" as RouteId,
    render: renderClientDisabled,
  },
  access_denied_app: {
    routeId: "access_denied_app" as RouteId,
    render: renderClientAccessDenied,
  },
  client_catalog_app: {
    routeId: "client_catalog_app" as RouteId,
    render: renderClientCatalog,
  },
  notfound_app: {
    routeId: "notfound_app" as RouteId,
    render: renderClientDisabled,
  },
  // Pages Inventory (APP)
  pages_inventory_app: {
    routeId: "pages_inventory_app" as RouteId,
    render: async (root) => {
      const m = await import("../client-pages-inventory/Page");
      m.renderClientPagesInventory(root);
    },
    async: true,
  },
};

export function renderRegistryApp(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-container">
      <h1>APP / REGISTRY</h1>
      <p>Registry des pages (stub).</p>
    </div>
  `;
}

export function renderAppPage(routeId: RouteId, root: HTMLElement): void {
  const entry = APP_PAGES_REGISTRY[routeId];
  if (!entry) {
    APP_PAGES_REGISTRY["notfound_app"]?.render?.(root);
    return;
  }

  try {
    if (entry.async) {
      (entry.render(root) as Promise<void>).catch(() => {
        APP_PAGES_REGISTRY["notfound_app"]?.render?.(root);
      });
    } else {
      entry.render(root);
    }
  } catch {
    APP_PAGES_REGISTRY["notfound_app"]?.render?.(root);
  }
}
