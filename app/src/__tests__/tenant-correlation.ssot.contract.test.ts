import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("tenant + correlation SSOT (contract)", () => {
  it("exports tenant + correlation helpers", async () => {
    const t = await import("../core/tenant/tenantContext");
    const c = await import("../core/observability/correlation");
    expect(typeof t.getTenantIdSSOT).toBe("function");
    expect(typeof c.getCorrelationIdSSOT).toBe("function");
    expect(typeof c.newCorrelationIdSSOT).toBe("function");
  });

  it("clients surface does not define local getTenantId/getCorrelationId generators", () => {
    const f = path.resolve(__dirname, "..", "surfaces", "app", "clients", "Page.tsx");
    const src = fs.readFileSync(f, "utf-8");
    expect(src.includes("function getTenantId(")).toBe(false);
    expect(src.includes("function getCorrelationId(")).toBe(false);
    expect(src.includes('getTenantIdSSOT')).toBe(true);
    expect(src.includes('newCorrelationIdSSOT')).toBe(true);
  });
});
