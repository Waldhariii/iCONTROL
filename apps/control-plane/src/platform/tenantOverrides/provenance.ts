export type TenantOverridesProvenance = {
  tenantId: string;
  at: string;
  actorId?: string;
  safeMode: {
    enabled: boolean;
    reason?: string;
    persistedEnabled?: boolean;
  };
  overrides: {
    attempted: boolean;
    applied: boolean;
    hash?: string;
    updatedAt?: string;
    source?: string;
  };
  decision: "APPLIED" | "IGNORED_SAFE_MODE" | "REJECTED_GUARD" | "FAILED_READ" | "NO_OVERRIDES";
  note?: string;
};

const last = new Map<string, TenantOverridesProvenance>();

export function setTenantOverridesProvenance(p: TenantOverridesProvenance) {
  last.set(p.tenantId, p);
}

export function getTenantOverridesProvenance(tenantId: string): TenantOverridesProvenance | undefined {
  return last.get(tenantId);
}

export function clearTenantOverridesProvenance(tenantId: string) {
  last.delete(tenantId);
}
