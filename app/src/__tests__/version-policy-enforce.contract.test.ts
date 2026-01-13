import { describe, it, expect } from "vitest";
import { evaluateVersionPolicy } from "../policies/version_policy.enforce";
import { ERROR_CODES } from "../core/errors/error_codes";

describe("version-policy enforcement (decision-only contract)", () => {
  it("OK yields OK decision when no other directives", () => {
    const decisions = evaluateVersionPolicy({
      status: "OK",
      min_version: "0.0.0",
      latest_version: "0.0.0",
      message: "",
      safe_mode: false,
      capabilities: [],
    });
    expect(decisions.length).toBe(1);
    expect(decisions[0]).toEqual({ kind: "OK" });
  });

  it("SOFT_BLOCK yields WARN_VERSION_SOFT_BLOCK", () => {
    const decisions = evaluateVersionPolicy({
      status: "SOFT_BLOCK",
      min_version: "1.0.0",
      latest_version: "2.0.0",
      message: "Update recommended",
      safe_mode: false,
      capabilities: [],
    });

    const soft = decisions.find((d) => d.kind === "SOFT_BLOCK");
    expect(soft).toBeTruthy();
    expect((soft as any).warnCode).toBe(ERROR_CODES.WARN_VERSION_SOFT_BLOCK);
  });

  it("HARD_BLOCK yields ERR_VERSION_HARD_BLOCK", () => {
    const decisions = evaluateVersionPolicy({
      status: "HARD_BLOCK",
      min_version: "2.0.0",
      latest_version: "2.0.0",
      message: "Blocked",
      safe_mode: false,
      capabilities: [],
    });

    const hard = decisions.find((d) => d.kind === "HARD_BLOCK");
    expect(hard).toBeTruthy();
    expect((hard as any).errCode).toBe(ERROR_CODES.ERR_VERSION_HARD_BLOCK);
  });

  it("MAINTENANCE yields ERR_MAINTENANCE_MODE", () => {
    const decisions = evaluateVersionPolicy({
      status: "MAINTENANCE",
      min_version: "0.0.0",
      latest_version: "0.0.0",
      message: "Down",
      safe_mode: false,
      capabilities: [],
    });

    const m = decisions.find((d) => d.kind === "MAINTENANCE");
    expect(m).toBeTruthy();
    expect((m as any).errCode).toBe(ERROR_CODES.ERR_MAINTENANCE_MODE);
  });

  it("safe_mode=true emits FORCE_SAFE_MODE in addition to status decisions", () => {
    const decisions = evaluateVersionPolicy({
      status: "SOFT_BLOCK",
      min_version: "0.0.0",
      latest_version: "0.0.0",
      message: "Force safe",
      safe_mode: true,
      capabilities: [],
    });

    expect(decisions.some((d) => d.kind === "FORCE_SAFE_MODE")).toBe(true);
    expect(decisions.some((d) => d.kind === "SOFT_BLOCK")).toBe(true);
  });
});
