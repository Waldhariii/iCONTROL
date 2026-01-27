import { describe, it, expect, vi } from "vitest";

const loadCpRouter = async () => {
  vi.resetModules();
  process.env.VITE_APP_KIND = "CONTROL_PLANE";
  return await import("../router");
};

describe("router system/logs (CP)", () => {
  it("maps #/system -> system_cp", async () => {
    const { getRouteIdFromHash } = await loadCpRouter();
    expect(getRouteIdFromHash("#/system")).toBe("system_cp");
  });

  it("maps #/logs -> logs_cp", async () => {
    const { getRouteIdFromHash } = await loadCpRouter();
    expect(getRouteIdFromHash("#/logs")).toBe("logs_cp");
  });
});
