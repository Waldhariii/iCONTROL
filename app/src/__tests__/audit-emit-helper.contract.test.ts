import { describe, it, expect, vi } from "vitest";
import { emitAudit } from "../policies/audit.emit";
import { AUDIT_SCOPES } from "../policies/audit.scopes";

describe("audit — emitAudit helper (contract)", () => {
  it("does not throw and returns false when emitter is absent", () => {
    const rt: any = {};
    expect(() =>
      emitAudit(rt, "WARN", "X", "msg", { scope: AUDIT_SCOPES.CONTROL_PLANE, source: "control_plane" })
    ).not.toThrow();
    const ok = emitAudit(rt, "WARN", "X", "msg", { scope: AUDIT_SCOPES.CONTROL_PLANE, source: "control_plane" });
    expect(ok).toBe(false);
  });

  it("emits payload with ts/module/scope/source and returns true", () => {
    const emit = vi.fn();
    const rt: any = { audit: { emit } };

    const ok = emitAudit(
      rt,
      "WARN",
      "WARN_X",
      "hello",
      { scope: AUDIT_SCOPES.CONTROL_PLANE, source: "control_plane", data: { k: 1 } }
    );

    expect(ok).toBe(true);
    expect(emit.mock.calls.length).toBe(1);

    const payload = emit.mock.calls[0][3];
    expect(payload.ts).toBeDefined();
    expect(typeof payload.ts).toBe("string");
    expect(payload.module).toBe("control_plane");
    expect(payload.scope).toBe(AUDIT_SCOPES.CONTROL_PLANE);
    expect(payload.source).toBe("control_plane");
    expect(payload.k).toBe(1);
  });

  it("sets failure flag when emitter throws (no throw outward)", () => {
    const emit = vi.fn(() => {
      throw new Error("boom");
    });
    const rt: any = { audit: { emit } };

    expect(() =>
      emitAudit(rt, "WARN", "X", "msg", { scope: AUDIT_SCOPES.CONTROL_PLANE, source: "control_plane" }, "__AUDIT_FAILED__")
    ).not.toThrow();

    expect(rt.__AUDIT_FAILED__).toBe(true);
  });
});
