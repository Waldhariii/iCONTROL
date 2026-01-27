import { describe, it, expect, vi } from "vitest";

const loadCpRouter = async () => {
  vi.resetModules();
  process.env.VITE_APP_KIND = "CONTROL_PLANE";
  return await import("../router");
};

describe("router: dossiers (CP)", () => {
  it("maps #/dossiers -> dossiers_cp", async () => {
    const { getRouteIdFromHash } = await loadCpRouter();
    expect(getRouteIdFromHash("#/dossiers")).toBe("dossiers_cp");
  });
});
