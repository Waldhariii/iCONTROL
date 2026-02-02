/**
 * Move13: Tenant Matrix Enforcement Helper (SSOT)
 *
 * Enforces access to pages/surfaces using TENANT_FEATURE_MATRIX templates:
 * - enabled_pages[] : page/surface keys
 * - enabled_capabilities[] : capability keys
 *
 * Must stay ports-only (no cross-boundary imports).
 */
import { getEnabledCapabilitiesForTenant } from "../ssot/tenantMatrixLoader";
import type { ReasonCode } from "./reasonCodes.v1";

export type TenantMatrixDecision = Readonly<{
  allow: boolean;
  reasonCode: ReasonCode;
}>;

function has(arr: readonly string[] | null | undefined, key: string): boolean {
  return Array.isArray(arr) && arr.includes(key);
}

export function enforceTenantMatrix(params: {
  tenantId: string;
  requiredPage?: string;       // e.g. "cp.settings"
  requiredCapability?: string; // e.g. "canAdminEntitlements"
}): TenantMatrixDecision {
  const caps = getEnabledCapabilitiesForTenant(params.tenantId);

  // Capability gate (strongest, deterministic)
  if (params.requiredCapability && !has(caps, params.requiredCapability)) {
    return { allow: false, reasonCode: "ERR_CAPABILITY_DISABLED" };
  }

  // Page gate: we intentionally map page requirement to a capability if project prefers cap-only.
  // If you already model pages in matrix, wire it here later; for now we treat page as capability alias.
  if (params.requiredPage && !has(caps, params.requiredPage)) {
    // If pages are not yet in caps, keep reason explicit
    return { allow: false, reasonCode: "ERR_PAGE_DISABLED" };
  }

  return { allow: true, reasonCode: "OK_POLICY_ALLOW" };
}
