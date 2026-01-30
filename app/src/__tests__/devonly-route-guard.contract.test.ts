import { describe, it, expect } from "vitest";
import { guardDevOnlyRoute } from "../pages/cp/_shared/devOnlyRouteGuard";

describe("DEV-only route guard SSOT (contract)", () => {
  it("exports guardDevOnlyRoute and returns string|null", () => {
    expect(typeof guardDevOnlyRoute).toBe("function");
    const v = guardDevOnlyRoute({ routeKey: "x", marker: "M", fallback: "dashboard_cp" });
    expect(v === null || typeof v === "string").toBe(true);
  });
});
