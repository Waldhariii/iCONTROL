import type { VfsPort } from "../ports/vfs.contract";
import type { SnapshotPort } from "../ports/snapshot.contract";
import type { TenantKey, TenantRecord } from "../ports/tenantOnboarding.contract";

type StoreDeps = {
  vfs: VfsPort;
  snapshot: SnapshotPort;
};

function tenantPath(tenantKey: TenantKey): string {
  return `/ssot/tenants/${tenantKey}/tenant.json`;
}

function stableJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2) + "\n";
}

export async function storeGetTenant(deps: StoreDeps, tenantKey: TenantKey): Promise<TenantRecord | null> {
  const r = await deps.vfs.readUtf8(tenantPath(tenantKey));
  if (!r.ok) return null;
  try {
    const parsed = JSON.parse(r.contentUtf8) as TenantRecord;
    if (!parsed || parsed.tenantKey !== tenantKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function storePutTenant(deps: StoreDeps, tenant: TenantRecord): Promise<{ ok: true } | { ok: false; reason: string }> {
  const snap = await deps.snapshot.createSnapshot(`tenant:${tenant.tenantKey}`);
  if (!snap.ok) return { ok: false, reason: snap.reason };

  const w = await deps.vfs.writeUtf8(tenantPath(tenant.tenantKey), stableJson(tenant));
  if (!w.ok) return { ok: false, reason: w.reason };
  return { ok: true };
}
