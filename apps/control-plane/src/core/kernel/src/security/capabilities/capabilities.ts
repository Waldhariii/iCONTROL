import type { Capability, CapabilityGrant, CapabilityPolicy } from "./capabilities.contract";

export function createCapabilityPolicy(): CapabilityPolicy {
  return {
    has(grant: CapabilityGrant, cap: Capability): boolean {
      return Array.isArray(grant.capabilities) && grant.capabilities.includes(cap);
    },
  };
}
