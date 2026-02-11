// @ts-nocheck
export type AuditEntry = {
  code: string;
  ts: string;
  page?: string;
  section?: string;
  actionId?: string;
  detail?: string;
};

const STORE_KEY = "__ICONTROL_AUDIT_LOG__";

function getStore(): AuditEntry[] {
  const g = globalThis as any;
  if (!g[STORE_KEY]) g[STORE_KEY] = [];
  return g[STORE_KEY] as AuditEntry[];
}

export function recordObs(entry: Omit<AuditEntry, "ts"> & { ts?: string }): void {
  const store = getStore();
  store.push({
    ...entry,
    ts: entry.ts ?? new Date().toISOString()
  });
  if (store.length > 300) store.splice(0, store.length - 300);
}

export function getAuditLog(): AuditEntry[] {
  return [...getStore()];
}

export function clearAuditLog(): void {
  const g = globalThis as any;
  g[STORE_KEY] = [];
}
