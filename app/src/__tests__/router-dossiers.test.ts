import { describe, it, expect } from "vitest";
import { getRouteId } from "../router";

describe("router: dossiers", () => {
  it("maps #/dossiers", () => {
    (globalThis as any).location = { hash: "#/dossiers" };
    expect(getRouteId()).toBe("dossiers");
  });
});
