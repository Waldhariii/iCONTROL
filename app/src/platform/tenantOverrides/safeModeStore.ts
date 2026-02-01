import type { PolicyContext } from "../policy/types";
import { vfsSet } from "../vfs-write/writeGateway";
import { Vfs, type VfsScope } from "../storage/vfs";

export type TenantSafeModeRecord = {
  schemaVersion: 1;
  enabled: boolean;
  reason?: string;
  at?: string;
  updatedBy?: string;
};

function pathFor(tenantId: string) {
  return `tenant/${tenantId}/safe_mode.json`;
}

function validate(rec: any): TenantSafeModeRecord {
  if (!rec || typeof rec !== "object") throw new Error("ERR_SAFE_MODE_INVALID: root");
  if (rec.schemaVersion !== 1) throw new Error("ERR_SAFE_MODE_INVALID: schemaVersion");
  if (typeof rec.enabled !== "boolean") throw new Error("ERR_SAFE_MODE_INVALID: enabled");
  if (rec.reason !== undefined && typeof rec.reason !== "string") throw new Error("ERR_SAFE_MODE_INVALID: reason");
  if (rec.at !== undefined && typeof rec.at !== "string") throw new Error("ERR_SAFE_MODE_INVALID: at");
  if (rec.updatedBy !== undefined && typeof rec.updatedBy !== "string") throw new Error("ERR_SAFE_MODE_INVALID: updatedBy");
  return rec as TenantSafeModeRecord;
}

export async function readTenantSafeMode(tenantId: string): Promise<TenantSafeModeRecord> {
  const scope: VfsScope = { tenantId, namespace: "overrides" };
  const key = "safe_mode.json";
  void pathFor;

  const raw = Vfs.get(scope, key);
  if (!raw) return { schemaVersion: 1, enabled: false };
  return validate(JSON.parse(raw));
}

export async function writeTenantSafeMode(input: {
  tenantId: string;
  enabled: boolean;
  reason?: string;
  actorId?: string;
}) {
  const scope: VfsScope = { tenantId: input.tenantId, namespace: "overrides" };
  const key = "safe_mode.json";
  void pathFor;
  const rec: TenantSafeModeRecord = {
    schemaVersion: 1,
    enabled: input.enabled,
    reason: input.reason,
    at: new Date().toISOString(),
    updatedBy: input.actorId,
  };

  const ctx: PolicyContext = {
    appKind: "CP",
    tenantId: input.tenantId,
    userId: input.actorId,
    roles: [],
    entitlements: {},
    safeMode: false,
  };

  await vfsSet(ctx, scope, key, JSON.stringify(rec, null, 2) + "\n");
}
