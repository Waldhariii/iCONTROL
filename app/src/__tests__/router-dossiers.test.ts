import { describe, it, expect } from "vitest";
import { getRouteIdFromHash } from "../router";

describe("router: dossiers", () => {
  it("maps #/dossiers", () => {
    expect(getRouteIdFromHash("#/dossiers")).toBe("dossiers");
  });
});
