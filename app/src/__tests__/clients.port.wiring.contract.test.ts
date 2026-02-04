import { describe, it, expect } from "vitest";

describe("clients port wiring (contract)", () => {
  it("can import vfs adapter module (even if singleton not present)", async () => {
    const mod = await import("../platform/adapters/clients/clientsAdapter.vfs");
    expect(mod).toBeTruthy();
  });
});
