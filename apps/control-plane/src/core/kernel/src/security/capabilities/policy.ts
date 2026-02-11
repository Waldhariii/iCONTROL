import type { Capability, CapabilityGrant } from "./model";

export function requireCap(grant: CapabilityGrant, cap: Capability): void {
  if (!grant.tenantId) throw Object.assign(new Error("tenantId required"), { code: "ERR_TENANT_REQUIRED" });
  if (!grant.caps?.includes(cap)) throw Object.assign(new Error(`missing cap: ${cap}`), { code: "ERR_CAP_MISSING" });
}
