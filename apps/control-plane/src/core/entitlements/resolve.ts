import { getTenantId } from "../runtime/tenant";
import { loadEntitlements } from "./storage";
import { hasModule, hasPlan } from "./gates";
import { getEnabledPagesForPlan } from "../ssot/tenantMatrixLoader";

export function hasEntitlement(entitlement: string, tenantId = "local"): boolean {
  const e = loadEntitlements(tenantId);
  if (entitlement === "pro") return hasPlan(e, "PRO");
  if (entitlement === "enterprise") return hasPlan(e, "ENTERPRISE");
  return hasModule(e, entitlement);
}

/** Phase 2.3–2.4: la route (route_id) est-elle dans enabled_pages du plan du tenant? */
export function isPageEnabledForTenant(routeId: string, tenantId?: string): boolean {
  const t = tenantId ?? getTenantId();
  const e = loadEntitlements(t);
  const plan = e.plan || "FREE";
  const pages = getEnabledPagesForPlan(plan);
  return pages.includes(routeId);
}
