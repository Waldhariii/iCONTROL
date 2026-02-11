import { describe, it, expect } from "vitest";
import { getRouteCatalogV1, listPublicRoutes, isRouteAllowed } from "../core/routes/routeCatalog";

describe("SSOT Route Catalog (contract)", () => {
  it("exports a valid v1 catalog with non-empty APP and CP routes", () => {
    const c = getRouteCatalogV1();
    expect(c.schema).toBe("ROUTE_CATALOG_V1");
    expect(typeof c.app.base).toBe("string");
    expect(typeof c.cp.base).toBe("string");
    expect(Array.isArray(c.app.routes)).toBe(true);
    expect(Array.isArray(c.cp.routes)).toBe(true);
    expect(c.app.routes.length).toBeGreaterThan(0);
    expect(c.cp.routes.length).toBeGreaterThan(0);
  });

  it("listPublicRoutes returns stable arrays; isRouteAllowed works", () => {
    const app = listPublicRoutes("APP");
    const cp = listPublicRoutes("CP");
    expect(Array.isArray(app)).toBe(true);
    expect(Array.isArray(cp)).toBe(true);
    expect(isRouteAllowed("APP", app[0] as string)).toBe(true);
    expect(isRouteAllowed("CP", cp[0] as string)).toBe(true);
    expect(isRouteAllowed("CP", "/app/#/dashboard")).toBe(false);
  });
});
