import { describe, it, expect, vi } from "vitest";
import { createAuditEmitter } from "../core/studio/runtime";

describe("Audit emitter adapter (contract)", () => {
  it("honors sink signature and applies redact(meta) if provided", () => {
    const sink = vi.fn();
    const redact = (meta: Record<string, unknown>) => ({
      ...meta,
      redacted: true,
      token: "***",
    });

    const audit = createAuditEmitter({ sink, redact });
    audit.emit("ERROR", "ERR_AUDIT_ADAPTER_TEST", { token: "secret", a: 1 });

    expect(sink).toHaveBeenCalledTimes(1);
    const [lvl, code, meta] = sink.mock.calls[0];
    expect(lvl).toBe("ERROR");
    expect(code).toBe("ERR_AUDIT_ADAPTER_TEST");
    expect(meta).toEqual({ token: "***", a: 1, redacted: true });
  });

  it("never throws even if sink throws", () => {
    const sink = () => {
      throw new Error("sink-fail");
    };
    const audit = createAuditEmitter({ sink });
    expect(() => audit.emit("WARN", "WARN_SINK_FAIL")).not.toThrow();
  });
});
