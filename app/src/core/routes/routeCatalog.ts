/**
 * SSOT Route Catalog — V1
 * Single-source-of-truth for allowed public routes (APP + CP).
 * Governance: gate-route-catalog ensures file shape + non-empty routes.
 */
import catalog from "../../../../config/ssot/ROUTE_CATALOG.json";

export type AppKind = "APP" | "CP";

export type RouteCatalogV1 = Readonly<{
  schema: "ROUTE_CATALOG_V1";
  app: { base: string; routes: readonly string[] };
  cp: { base: string; routes: readonly string[] };
  notes?: readonly string[];
}>;

export function getRouteCatalogV1(): RouteCatalogV1 {
  return catalog as RouteCatalogV1;
}

export function listPublicRoutes(kind: AppKind): readonly string[] {
  const c = getRouteCatalogV1();
  return kind === "CP" ? c.cp.routes : c.app.routes;
}

export function isRouteAllowed(kind: AppKind, route: string): boolean {
  const routes = listPublicRoutes(kind);
  return Array.isArray(routes) && routes.includes(route);
}
