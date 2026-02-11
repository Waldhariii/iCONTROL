import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Governance contract:
 * Importing critical UI/runtime modules must not trigger navigation.
 *
 * We enforce this by spying on the canonical navigate() function rather than
 * trying to override window/location objects (which is brittle in test envs).
 */

// IMPORTANT: path must match where modules import navigate() from.
vi.mock("../runtime/navigate", async () => {
  // We still want the module to load for other imports if needed,
  // but for this test we only need navigate().
  return {
    navigate: vi.fn(),
  };
});

// Some modules might import navigate from apps/control-plane/src/runtime/navigate.ts via relative paths.
// Ensure the same module id is mocked everywhere in this test file.
const getNavigate = async () => {
  const m: any = await import("../runtime/navigate");
  return m.navigate as unknown as ReturnType<typeof vi.fn>;
};

describe("Governance: critical modules have no import-time navigation side effects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("importing localAuth does not call navigate()", async () => {
    const nav = await getNavigate();
    await import("../localAuth");
    expect(nav).not.toHaveBeenCalled();
  });

  it("importing dashboard page module does not call navigate()", async () => {
    const nav = await getNavigate();
    await import("@modules/core-system/ui/frontend-ts/pages/dashboard");
    expect(nav).not.toHaveBeenCalled();
  });

  it("importing access-denied page does not call navigate()", async () => {
    const nav = await getNavigate();
    await import("@modules/core-system/ui/frontend-ts/pages/access-denied/index");
    expect(nav).not.toHaveBeenCalled();
  });


  it("importing modules login page does not call navigate()", async () => {
    const nav = await getNavigate();
    await import("@modules/core-system/ui/frontend-ts/pages/login");
    expect(nav).not.toHaveBeenCalled();
  });

  it("importing modules settings page does not call navigate()", async () => {
    const nav = await getNavigate();
    await import("@modules/core-system/ui/frontend-ts/pages/settings");
    expect(nav).not.toHaveBeenCalled();
  });

  it("importing app router does not call navigate()", async () => {
    const nav = await getNavigate();
    await import("../router");
    expect(nav).not.toHaveBeenCalled();
  });

  it("importing app runtime router does not call navigate()", async () => {
    const nav = await getNavigate();
    await import("../runtime/navigate");
    expect(nav).not.toHaveBeenCalled();
  });
});
