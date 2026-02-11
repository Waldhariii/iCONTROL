import type { DefaultEntitlementsPort, EntitlementsSnapshot } from "./defaultEntitlements.contract";

function uniqSorted(arr: string[]): string[] {
  return Array.from(new Set(arr)).sort((a,b)=>a.localeCompare(b));
}

const FREE_CORE_BASELINE: string[] = uniqSorted([
  "core.access",
  "cp.nav",
  "cp.users.read",
  "cp.settings.read",
  "cp.entitlements.read",
]);

export function makeDefaultEntitlementsFacade(): DefaultEntitlementsPort {
  return {
    async getDefaultEntitlements(tenantKey: string): Promise<EntitlementsSnapshot> {
      return {
        tenantKey,
        granted: FREE_CORE_BASELINE.slice(),
        source: "default-baseline",
      };
    },
  };
}
