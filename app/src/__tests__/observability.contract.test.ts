import { describe, it, expect, vi } from "vitest";
import { info, setCorrelationId } from "../platform/observability";

describe("observability (contract)", () => {
  it("logs include correlationId", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    setCorrelationId("corr_test_123");
    info("OK", "hello", { tenantId: "t1", role: "user", appKind: "APP", surface: "login" });
    expect(spy).toHaveBeenCalled();
    const payload = String(spy.mock.calls[0][0]);
    expect(payload).toContain('"correlationId":"corr_test_123"');
    spy.mockRestore();
  });
});
