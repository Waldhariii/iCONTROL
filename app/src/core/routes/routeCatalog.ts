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

type LegacyRoute = {
  path?: string;
  app_surface?: string;
};

function normalizeLegacyPath(base: "/app" | "/cp", path: string): string {
  if (path.startsWith("/")) return path;
  if (path.startsWith("#/")) return `${base}/${path}`;
  return `${base}/#/${path.replace(/^#?\/?/, "")}`;
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

function normalizeCatalog(raw: any): RouteCatalogV1 {
  if (raw?.schema === "ROUTE_CATALOG_V1") return raw as RouteCatalogV1;

  const routes: LegacyRoute[] = Array.isArray(raw?.routes) ? raw.routes : [];
  if (!routes.length) throw new Error("ERR_ROUTE_CATALOG_INVALID");

  const app = unique(
    routes
      .filter((r) => String(r?.app_surface || "").toUpperCase() === "APP")
      .map((r) => normalizeLegacyPath("/app", String(r?.path || "")))
      .filter(Boolean),
  );
  const cp = unique(
    routes
      .filter((r) => String(r?.app_surface || "").toUpperCase() === "CP")
      .map((r) => normalizeLegacyPath("/cp", String(r?.path || "")))
      .filter(Boolean),
  );

  if (!app.length || !cp.length) throw new Error("ERR_ROUTE_CATALOG_INVALID");

  return {
    schema: "ROUTE_CATALOG_V1",
    app: { base: "/app", routes: app },
    cp: { base: "/cp", routes: cp },
    notes: ["normalized from legacy ROUTE_CATALOG shape"],
  };
}

export function getRouteCatalogV1(): RouteCatalogV1 {
  return normalizeCatalog(catalog as unknown as Record<string, unknown>);
}

export function listPublicRoutes(kind: AppKind): readonly string[] {
  const c = getRouteCatalogV1();
  return kind === "CP" ? c.cp.routes : c.app.routes;
}

export function isRouteAllowed(kind: AppKind, route: string): boolean {
  const routes = listPublicRoutes(kind);
  return Array.isArray(routes) && routes.includes(route);
}

/**
 * PHASE11/WAVE3.2.1
 * SSOT_ROUTE_MARKER: "/clients"
 * TODO: Wire this into the canonical route map (strict schema may require proper insertion).
 */
// SSOT_ROUTE_CANDIDATE: "/clients"
