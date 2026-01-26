// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { describe, it, expect } from "vitest";
import { getRouteIdFromHash } from "../router";

describe("router system/logs", () => {
  it("maps #/system", () => {
    expect(getRouteIdFromHash("#/system")).toBe("system");
  });

  it("maps #/logs", () => {
    expect(getRouteIdFromHash("#/logs")).toBe("logs");
  });
});
