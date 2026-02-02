import { describe, it, expect } from "vitest";
import { MemoryEventStore, createEventBus } from "../events";

describe("Event Backbone v1 (contract)", () => {
  it("emit() must persist outbox and replay() must deliver ordered events", async () => {
    const store = new MemoryEventStore();
    const bus = createEventBus(store);

    const tenantId = "t-1";
    const base = Date.now();

    await bus.emit({ id: "e-1", tenantId, type: "jobs.workOrder.created", ts: base, payload: { a: 1 }, v: 1 });
    await bus.emit({ id: "e-2", tenantId, type: "jobs.workOrder.updated", ts: base + 1, payload: { b: 2 }, v: 1 });
    await bus.emit({ id: "e-3", tenantId, type: "billing.invoice.created", ts: base + 2, payload: { c: 3 }, v: 1 });

    const got: string[] = [];
    const res = await bus.replay(
      tenantId,
      { fromTs: base, toTs: base + 3, limit: 50 },
      (evt) => { got.push(`${evt.id}:${evt.type}`); }
    );

    expect(res.count).toBe(3);
    expect(got).toEqual([
      "e-1:jobs.workOrder.created",
      "e-2:jobs.workOrder.updated",
      "e-3:billing.invoice.created",
    ]);
  });

  it("emit() must reject invalid envelopes", async () => {
    const store = new MemoryEventStore();
    const bus = createEventBus(store);

    // missing ts
    const r = await bus.emit({ id: "x", tenantId: "t", type: "x", payload: {} } as any);
    expect(r.accepted).toBe(false);
    expect(r.stored).toBe(false);
    expect(r.reason).toBe("ERR_EVENT_INVALID");
  });

  it("replay() must support type filter", async () => {
    const store = new MemoryEventStore();
    const bus = createEventBus(store);

    const tenantId = "t-2";
    const base = Date.now();

    await bus.emit({ id: "a", tenantId, type: "A", ts: base, payload: 1 });
    await bus.emit({ id: "b", tenantId, type: "B", ts: base + 1, payload: 2 });
    await bus.emit({ id: "c", tenantId, type: "A", ts: base + 2, payload: 3 });

    const got: string[] = [];
    const res = await bus.replay(tenantId, { fromTs: base, toTs: base + 3, types: ["A"] }, (e) => got.push(e.id));
    expect(res.count).toBe(2);
    expect(got).toEqual(["a", "c"]);
  });
});
