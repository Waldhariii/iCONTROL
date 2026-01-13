import { describe, it, expect } from "vitest";
import { forcedOffFlagsFromCapabilities } from "../policies/feature_flags.capabilities";
import { forceOffMany } from "../policies/feature_flags.merge";

describe("control plane capabilities → forced OFF (contract)", () => {
  it("maps capabilities to forced OFF keys (dedup + sorted)", () => {
    const keys = forcedOffFlagsFromCapabilities(["cap.disable.settings", "cap.disable.settings"]);
    expect(keys.length).toBeGreaterThanOrEqual(1);
    expect(keys).toEqual([...keys].sort());
  });

  it("forceOffMany injects FORCE_OFF entries", () => {
    const out = forceOffMany({ flags: { "x.demo": { state: "ON" } } }, ["x.demo", "x.new"]);
    expect(out.flags["x.demo"].state).toBe("FORCE_OFF");
    expect(out.flags["x.new"].state).toBe("FORCE_OFF");
  });
});
