/**
 * routeCatalogLoader — construit les allowlists (Admin, Client) depuis ROUTE_CATALOG.json.
 * Phase 2.1: une seule source (runtime/configs/ssot/ROUTE_CATALOG.json).
 * Statuts autorisés: ACTIVE, EXPERIMENTAL (HIDDEN/DEPRECATED → bloqués par le guard).
 */

// Alias Vite @config -> iCONTROL/config (vite.config resolve.alias)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- résolution via alias
// @ts-ignore
import catalog from "@config/ssot/ROUTE_CATALOG.json";

type RouteEntry = { route_id: string; path: string | null; app_surface: string; status: string };

function buildAllowlist(surface: "CP" | "CLIENT", statuses: string[]): Set<string> {
  const s = new Set<string>();
  const routes = (catalog as { routes: RouteEntry[] }).routes;
  for (const r of routes) {
    if (r.app_surface !== surface) continue;
    if (!statuses.includes(r.status)) continue;
    if (r.path) s.add(r.path);
  }
  return s;
}

/** Routes autorisées pour la surface CP (Admin). ACTIVE + EXPERIMENTAL. */
export const ADMIN_ROUTE_ALLOWLIST = buildAllowlist("CP", ["ACTIVE", "EXPERIMENTAL"]);

/** Routes autorisées pour la surface CLIENT (APP disabled). ACTIVE + EXPERIMENTAL. */
export const CLIENT_ROUTE_ALLOWLIST = buildAllowlist("CLIENT", ["ACTIVE", "EXPERIMENTAL"]);

/** Vérifie si un route_id est dans le catalogue avec un status servi (non HIDDEN/DEPRECATED). */
export function isRouteInCatalog(routeId: string, statuses: string[] = ["ACTIVE", "EXPERIMENTAL"]): boolean {
  const routes = (catalog as { routes: RouteEntry[] }).routes;
  return routes.some((r) => r.route_id === routeId && statuses.includes(r.status));
}
