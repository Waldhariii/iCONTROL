// @ts-nocheck
import type { Entitlements } from "./Entitlements";

export type EntitlementKey = keyof Entitlements;

export type PolicyDecision = {
  allowed: boolean;
  key: EntitlementKey;
  tenantId: string;
  reason: string;
};

export function canUseEntitlement(tenantId: string, entitlements: Entitlements, key: EntitlementKey): PolicyDecision {
  const value = Boolean(entitlements[key]);
  return {
    allowed: value,
    key,
    tenantId,
    reason: value ? "entitlement_allowed" : "entitlement_denied",
  };
}

export class EntitlementError extends Error {
  code = "ERR_ENTITLEMENT_DENIED" as const;
  tenantId: string;
  entitlement: EntitlementKey;

  constructor(tenantId: string, entitlement: EntitlementKey) {
    super(`Entitlement denied: ${entitlement} (tenant=${tenantId})`);
    this.tenantId = tenantId;
    this.entitlement = entitlement;
  }
}

export function requireEntitlement(tenantId: string, entitlements: Entitlements, key: EntitlementKey): void {
  const d = canUseEntitlement(tenantId, entitlements, key);
  if (!d.allowed) throw new EntitlementError(tenantId, key);
}
