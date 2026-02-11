export type TenantId = string;

let currentTenant: TenantId | null = null;

export function setTenantContext(tid: TenantId | null) {
  currentTenant = tid;
}

export function getTenantContext(): TenantId | null {
  return currentTenant;
}

export function assertTenantContext(tid: TenantId) {
  if (!tid) throw new Error("ERR_TENANT_REQUIRED");
  const cur = getTenantContext();
  if (cur && cur !== tid) throw new Error("ERR_TENANT_CONTEXT_MISMATCH");
}
