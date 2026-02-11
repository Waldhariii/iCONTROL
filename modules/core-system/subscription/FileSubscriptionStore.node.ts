// @ts-nocheck
/**
 * Node fallback (pure TS) for environments without native .node bindings.
 * Contract: export class FileSubscriptionStore.
 */
import fs from "node:fs";
import path from "node:path";

type SubscriptionRecord = {
  tenantId: string;
  planId: string;
  updatedAt: number;
  [k: string]: unknown;
};

export class FileSubscriptionStore {
  private filePath: string;

  constructor(opts?: { filePath?: string }) {
    const p = opts?.filePath ?? path.join(process.cwd(), ".icontrol_subscriptions.json");
    this.filePath = p;
  }

  private readAll(): SubscriptionRecord[] {
    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as SubscriptionRecord[]) : [];
    } catch {
      return [];
    }
  }

  private writeAll(arr: SubscriptionRecord[]) {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(arr, null, 2), "utf8");
  }

  async getByTenantId(tenantId: string): Promise<SubscriptionRecord | null> {
    const all = this.readAll();
    return all.find((r) => r.tenantId === tenantId) ?? null;
  }

  async upsert(rec: SubscriptionRecord): Promise<void> {
    const all = this.readAll();
    const idx = all.findIndex((r) => r.tenantId === rec.tenantId);
    const next = { ...rec, updatedAt: Date.now() };
    if (idx >= 0) all[idx] = next;
    else all.push(next);
    this.writeAll(all);
  }
}
