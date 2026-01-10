// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { describe, it, expect } from "vitest";
import { getRouteId } from "../router";

describe("router system/logs", () => {
  it("maps #/system", () => {
    (globalThis as any).location = { hash: "#/system" };
    expect(getRouteId()).toBe("system");
  });

  it("maps #/logs", () => {
    (globalThis as any).location = { hash: "#/logs" };
    expect(getRouteId()).toBe("logs");
  });
});
