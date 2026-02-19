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

const ROUTES = (catalog as { routes: RouteEntry[] }).routes;

function buildAllowlist(surface: "CP" | "APP", statuses: string[]): Set<string> {
  const s = new Set<string>();
  for (const r of ROUTES) {
    if (r.app_surface !== surface) continue;
    if (!statuses.includes(r.status)) continue;
    if (r.path) s.add(r.path);
  }
  return s;
}

function buildPathToRouteIdMap(surface: "CP" | "APP"): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of ROUTES) {
    if (r.app_surface !== surface || !r.path) continue;
    const hash = r.path.replace(/^#\/?/, "").trim();
    if (hash) map.set(hash, r.route_id);
  }
  return map;
}

/** Routes autorisées pour la surface CP (Admin). ACTIVE + EXPERIMENTAL. */
export const ADMIN_ROUTE_ALLOWLIST = buildAllowlist("CP", ["ACTIVE", "EXPERIMENTAL"]);

/** Routes autorisées pour la surface APP (Client). ACTIVE + EXPERIMENTAL. Aligné sur app_surface "APP" du catalogue. */
export const CLIENT_ROUTE_ALLOWLIST = buildAllowlist("APP", ["ACTIVE", "EXPERIMENTAL"]);

/** Map path (sans #/) → route_id pour CP. Dérivé entièrement de ROUTE_CATALOG.json. */
export const CP_PATH_TO_ROUTE_ID = buildPathToRouteIdMap("CP");

/** Map path (sans #/) → route_id pour APP. Dérivé entièrement de ROUTE_CATALOG.json. */
export const APP_PATH_TO_ROUTE_ID = buildPathToRouteIdMap("APP");

/** Vérifie si un route_id est dans le catalogue avec un status servi (non HIDDEN/DEPRECATED). */
export function isRouteInCatalog(routeId: string, statuses: string[] = ["ACTIVE", "EXPERIMENTAL"]): boolean {
  return ROUTES.some((r) => r.route_id === routeId && statuses.includes(r.status));
}
