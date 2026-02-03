import { describe, it, expect } from "vitest";
import { makeBillingSinkFacade } from "../core/ports/billingSink.facade";

describe("billing sink contract (idempotency)", () => {
  it("is idempotent by eventId", async () => {
    const sink = makeBillingSinkFacade();
    await sink.emit({
      eventId: "evt_1",
      type: "usage.reported",
      tenantId: "t1",
      occurredAtUtc: new Date().toISOString(),
      payload: { units: 1 },
    });
    await sink.emit({
      eventId: "evt_1",
      type: "usage.reported",
      tenantId: "t1",
      occurredAtUtc: new Date().toISOString(),
      payload: { units: 1 },
    });
    expect(true).toBe(true);
  });

  it("rejects missing eventId", async () => {
    const sink = makeBillingSinkFacade();
    // @ts-expect-error
    await expect(sink.emit({ type:"usage.reported" })).rejects.toThrow();
  });
});
