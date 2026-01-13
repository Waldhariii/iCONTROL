import { describe, it, expect, vi } from "vitest";
import { emitAudit } from "../policies/audit.emit";
import { AUDIT_SCOPES } from "../policies/audit.scopes";

describe("audit — redaction guardrail (contract)", () => {
  it("redacts sensitive keys and preserves envelope", () => {
    const emit = vi.fn();
    const rt: any = { audit: { emit } };

    const ok = emitAudit(
      rt,
      "WARN",
      "WARN_TEST",
      "hello",
      {
        scope: AUDIT_SCOPES.CONTROL_PLANE,
        source: "control_plane",
        data: {
          authorization: "Bearer SUPERSECRET",
          token: "sk-1234567890abcdef1234567890abcdef",
          safe: "ok",
        },
      }
    );

    expect(ok).toBe(true);
    const payload = emit.mock.calls[0][3];

    expect(payload.ts).toBeDefined();
    expect(payload.module).toBe("control_plane");
    expect(payload.scope).toBe(AUDIT_SCOPES.CONTROL_PLANE);
    expect(payload.source).toBe("control_plane");

    expect(payload.authorization).toBe("[REDACTED]");
    expect(payload.token).toBe("[REDACTED]");
    expect(payload.safe).toBe("ok");
  });

  it("does not throw when redaction sees weird values", () => {
    const emit = vi.fn();
    const rt: any = { audit: { emit } };

    expect(() =>
      emitAudit(rt, "WARN", "WARN_X", "msg", {
        scope: AUDIT_SCOPES.CONTROL_PLANE,
        source: "control_plane",
        data: { fn: () => 1, sym: Symbol("x") },
      })
    ).not.toThrow();
  });
});
