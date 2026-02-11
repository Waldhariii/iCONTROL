import { describe, expect, it } from "vitest";

import { executePlan } from "./execute";
import type { RenderPlan } from "./types";

describe("executePlan (RBAC + SAFE_MODE)", () => {
  it("blocks when required permissions are missing", () => {
    const plan: RenderPlan = { ops: [{ op: "text", value: "x" }], requires: ["perm.a"] };
    const res = executePlan(plan, { claims: { permissions: [] } });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("forbidden");
  });

  it("allows when required permissions are present", () => {
    const plan: RenderPlan = { ops: [{ op: "text", value: "x" }], requires: ["perm.a"] };
    const res = executePlan(plan, { claims: { permissions: ["perm.a"] } });
    expect(res.ok).toBe(true);
  });

  it("SAFE_MODE STRICT forbids non-builtin components", () => {
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";
    const plan: RenderPlan = { ops: [{ op: "component", id: "x.custom" }] };
    const res = executePlan(plan, {});
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toContain("forbidden_component");
    (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
  });

  it("SAFE_MODE STRICT allows builtin components", () => {
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";
    const plan: RenderPlan = {
      ops: [{ op: "component", id: "builtin.table", props: { title: "T", columns: ["a"], rows: [{ a: 1 }] } }]
    };
    const res = executePlan(plan, {});
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toContain('data-builtin="table"');
    (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
  });
});
