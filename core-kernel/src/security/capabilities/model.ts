export type Capability = string;

export type CapabilityGrant = {
  tenantId: string;
  actorId?: string;
  caps: Capability[];
};

export function hasCap(grant: CapabilityGrant, cap: Capability): boolean {
  return grant.caps.includes(cap);
}
