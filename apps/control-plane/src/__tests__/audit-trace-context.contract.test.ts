import { describe, it, expect, vi } from "vitest";
import { emitAudit } from "../policies/audit.emit";
import { AUDIT_SCOPES } from "../policies/audit.scopes";

describe("audit — trace context correlation (contract)", () => {
  it("enriches payload with tenant/traceId/requestId and is idempotent per runtime", () => {
    const emit = vi.fn();

    const rt: any = { __tenant: "default", audit: { emit } };

    const ok1 = emitAudit(rt, "WARN", "WARN_X", "msg", {
      scope: AUDIT_SCOPES.CONTROL_PLANE,
      source: "control_plane",
      data: { k: 1 },
    });

    expect(ok1).toBe(true);
    expect(emit.mock.calls.length).toBe(1);

    const payload1 = emit.mock.calls[0][3];
    expect(payload1.tenant).toBe("default");
    expect(typeof payload1.traceId).toBe("string");
    expect(payload1.traceId.length).toBeGreaterThan(5);
    expect(typeof payload1.requestId).toBe("string");
    expect(payload1.requestId.length).toBeGreaterThan(5);

    // second emit: same runtime must keep same ids
    const ok2 = emitAudit(rt, "WARN", "WARN_Y", "msg2", {
      scope: AUDIT_SCOPES.CONTROL_PLANE,
      source: "control_plane",
      data: { k: 2 },
    });

    expect(ok2).toBe(true);
    expect(emit.mock.calls.length).toBe(2);

    const payload2 = emit.mock.calls[1][3];
    expect(payload2.traceId).toBe(payload1.traceId);
    expect(payload2.requestId).toBe(payload1.requestId);
  });

  it("does not throw when runtime is nullish", () => {
    const ok = emitAudit(null as any, "WARN", "WARN_Z", "msg", {
      scope: AUDIT_SCOPES.CONTROL_PLANE,
      source: "control_plane",
      data: { k: 1 },
    });
    expect(ok).toBe(false);
  });
});
