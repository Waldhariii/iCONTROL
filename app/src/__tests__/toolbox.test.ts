import { describe, it, expect, vi } from "vitest";

const loadCpRouter = async () => {
  vi.resetModules();
  process.env.VITE_APP_KIND = "CONTROL_PLANE";
  return await import("../router");
};

describe("router toolbox route (CP)", () => {
  it("maps #/toolbox -> toolbox_cp", async () => {
    const { getRouteIdFromHash } = await loadCpRouter();
    expect(getRouteIdFromHash("#/toolbox")).toBe("toolbox_cp");
  });
});
