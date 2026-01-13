import { describe, it, expect, vi } from "vitest";

async function getNavigate() {
  const mod = await import("../runtime/navigate");
  vi.spyOn(mod, "navigate");
  return mod.navigate as unknown as ReturnType<typeof vi.fn>;
}

describe("Activation: manual provisioning governance", () => {
  it("importing activation page does not call navigate()", async () => {
    const nav = await getNavigate();
    await import("../../../modules/core-system/ui/frontend-ts/pages/activation/index");
    expect(nav).not.toHaveBeenCalled();
  });
});
