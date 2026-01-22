/**
 * ICONTROL_APP_PAGES_REGISTRY_V2
 * Registry minimal pour la surface CLIENT (désactivée).
 *
 * Objectif: n'exposer que des routes de maintenance et une page canonique.
 */

import type { RouteId } from "../../router";
import { renderClientDisabled } from "./client-disabled";
import { renderClientAccessDenied } from "./client-access-denied";
import { renderClientCatalog } from "./client-catalog";

export type PageRenderer = (root: HTMLElement) => void | Promise<void>;

export interface PageRegistryEntry {
  routeId: RouteId;
  render: PageRenderer;
  async?: boolean;
}

export const APP_PAGES_REGISTRY: Record<RouteId, PageRegistryEntry> = {
  client_disabled: {
    routeId: "client_disabled",
    render: renderClientDisabled,
  },
  access_denied: {
    routeId: "access_denied",
    render: renderClientAccessDenied,
  },
  client_catalog: {
    routeId: "client_catalog",
    render: renderClientCatalog,
  },
  notfound: {
    routeId: "notfound",
    render: renderClientDisabled,
  },
};

export function renderAppPage(routeId: RouteId, root: HTMLElement): void {
  const entry = APP_PAGES_REGISTRY[routeId];
  if (!entry) {
    APP_PAGES_REGISTRY.notfound.render(root);
    return;
  }

  try {
    if (entry.async) {
      (entry.render(root) as Promise<void>).catch(() => {
        APP_PAGES_REGISTRY.notfound.render(root);
      });
    } else {
      entry.render(root);
    }
  } catch {
    APP_PAGES_REGISTRY.notfound.render(root);
  }
}
