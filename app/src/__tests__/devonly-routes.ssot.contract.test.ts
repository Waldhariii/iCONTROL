import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { DEV_ONLY_CP_ROUTES } from "../platform/routing/devOnlyRoutes";

describe("DEV-only routes SSOT (contract)", () => {
  it("registry has stable shape + contains ui-showcase", () => {
    expect(Array.isArray(DEV_ONLY_CP_ROUTES)).toBe(true);
    expect(DEV_ONLY_CP_ROUTES.length).toBeGreaterThan(0);
    const hit = DEV_ONLY_CP_ROUTES.find(r => r.routeKey === "ui-showcase");
    expect(!!hit).toBe(true);
    expect(hit!.seg).toBe("ui-showcase");
    expect(typeof hit!.fallback).toBe("string");
    expect(hit!.marker.includes("ICONTROL_")).toBe(true);
  });

  it("router uses guardDevOnlyRouteByKey for ui-showcase and keeps marker", () => {
    const p = "src/router.ts";
    expect(fs.existsSync(p)).toBe(true);
    const s = fs.readFileSync(p, "utf8");
    expect(s.includes('guardDevOnlyRouteByKey("ui-showcase")')).toBe(true);
    expect(s.includes("ICONTROL_CP_UI_SHOWCASE_ROUTER_GUARD")).toBe(true);
  });
});
