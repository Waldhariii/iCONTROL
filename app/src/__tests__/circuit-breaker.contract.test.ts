import { describe, it, expect, vi } from "vitest";
import { withBreaker, snapshotBreaker } from "../policies/circuit.breaker";
import { snapshotMetrics } from "../policies/metrics.registry";

describe("breaker — circuit breaker (contract)", () => {
  it("opens after threshold and blocks calls until cooldown, then half-open allows probe", async () => {
    const rt: any = {};
    const workFail = vi.fn(async () => {
      throw new Error("boom");
    });

    // fail 3 times -> open
    await expect(withBreaker(rt, "k1", workFail, { failureThreshold: 3, openMs: 50, timeoutMs: 200, maxRetries: 0 })).rejects.toBeTruthy();
    await expect(withBreaker(rt, "k1", workFail, { failureThreshold: 3, openMs: 50, timeoutMs: 200, maxRetries: 0 })).rejects.toBeTruthy();
    await expect(withBreaker(rt, "k1", workFail, { failureThreshold: 3, openMs: 50, timeoutMs: 200, maxRetries: 0 })).rejects.toBeTruthy();

    const snap1 = snapshotBreaker(rt, "k1")!;
    expect(snap1.state).toBe("OPEN");

    // blocked while open
    await expect(withBreaker(rt, "k1", async () => "ok", { openMs: 50, timeoutMs: 200, maxRetries: 0 })).rejects.toBeTruthy();

    // wait cooldown -> half open probe allowed
    await new Promise(r => setTimeout(r, 55));
    await expect(withBreaker(rt, "k1", async () => "ok", { successThreshold: 1, openMs: 50, timeoutMs: 200, maxRetries: 0 })).resolves.toBe("ok");

    const snap2 = snapshotBreaker(rt, "k1")!;
    expect(snap2.state).toBe("CLOSED");
  });

  it("records breaker metrics (open + calls) best-effort", async () => {
    const rt: any = {};
    await expect(withBreaker(rt, "k2", async () => { throw new Error("x"); }, { failureThreshold: 1, openMs: 100, timeoutMs: 200, maxRetries: 0 })).rejects.toBeTruthy();

    const m = snapshotMetrics(rt);
    const hasOpen = Object.keys(m.counters).some(k => k.startsWith("breaker.open.count"));
    const hasCalls = Object.keys(m.counters).some(k => k.startsWith("breaker.call.count"));
    expect(hasOpen).toBe(true);
    expect(hasCalls).toBe(true);
  });

  it("does not throw when runtime is nullish; still executes work", async () => {
    await expect(withBreaker(null as any, "k3", async () => "ok")).resolves.toBe("ok");
  });
});
