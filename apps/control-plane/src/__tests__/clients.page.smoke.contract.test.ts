import { describe, it, expect } from "vitest";

describe("clients page smoke (contract)", () => {
  it("imports without throwing", async () => {
    const mod = await import("../pages/clients");
    expect(mod).toBeTruthy();
  });
});
