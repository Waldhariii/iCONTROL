import { loadEntitlements } from "./storage";
import { hasModule, hasPlan } from "./gates";

export function hasEntitlement(entitlement: string, tenantId = "local"): boolean {
  const e = loadEntitlements(tenantId);
  if (entitlement === "pro") return hasPlan(e, "PRO");
  if (entitlement === "enterprise") return hasPlan(e, "ENTERPRISE");
  return hasModule(e, entitlement);
}
