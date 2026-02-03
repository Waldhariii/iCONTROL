import { describe, expect, test } from "vitest";
import { makeClientsAdapterVfs } from "../platform/adapters/clients/clientsAdapter.vfs";

type MemVfs = {
  store: Map<string, any>;
  readJson<T>(key: string): Promise<T>;
  writeJson<T>(key: string, value: T): Promise<void>;
  list(prefix: string): Promise<string[]>;
  exists(key: string): Promise<boolean>;
};

function memVfs(): MemVfs {
  const store = new Map<string, any>();
  return {
    store,
    async readJson<T>(key: string): Promise<T> {
      if (!store.has(key)) throw new Error("not found");
      return store.get(key) as T;
    },
    async writeJson<T>(key: string, value: T): Promise<void> {
      store.set(key, value);
    },
    async list(prefix: string): Promise<string[]> {
      return [...store.keys()].filter(k => k.startsWith(prefix));
    },
    async exists(key: string): Promise<boolean> {
      return store.has(key);
    },
  };
}

const META = { tenantId: "t1", correlationId: "corr_test", actorId: "a1" };

describe("clientsAdapter.vfs (contract) — clients.v1", () => {
  test("upsert then list returns item, schema v1, stable fields", async () => {
    const vfs = memVfs();
    const port = makeClientsAdapterVfs(vfs);

    const c = await port.upsert({ name: "Acme", email: "a@b.com" }, META);
    expect(c.schema).toBe("clients.v1");
    expect(c.id).toMatch(/^c_/);
    expect(c.createdAt).toMatch(/T/);
    expect(c.updatedAt).toMatch(/T/);

    const res = await port.list({ q: "acme", limit: 50 }, META);
    expect(res.items.length).toBe(1);
    expect(res.items[0].id).toBe(c.id);
    expect(res.nextCursor).toBeNull();
  });

  test("softDelete hides item by default, includeDeleted shows it", async () => {
    const vfs = memVfs();
    const port = makeClientsAdapterVfs(vfs);

    const c = await port.upsert({ name: "DeleteMe" }, META);
    await port.softDelete(c.id, META);

    const res1 = await port.list({ q: "deleteme" }, META);
    expect(res1.items.length).toBe(0);

    const res2 = await port.list({ q: "deleteme", includeDeleted: true }, META);
    expect(res2.items.length).toBe(1);
    expect(res2.items[0].deletedAt).toBeTruthy();
  });

  test("fail-soft migration: missing schema coerces to clients.v1", async () => {
    const vfs = memVfs();

    // seed an old-ish record without schema
    await vfs.writeJson("tenants/t1/clients/legacy1.json", {
      id: "legacy1",
      name: "Legacy Client",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
    });

    const port = makeClientsAdapterVfs(vfs);
    const got = await port.getById("legacy1", META);
    expect(got).not.toBeNull();
    expect(got!.schema).toBe("clients.v1");

    // self-heal write should have rewritten schema
    const raw = await vfs.readJson<any>("tenants/t1/clients/legacy1.json");
    expect(raw.schema).toBe("clients.v1");
  });
});
