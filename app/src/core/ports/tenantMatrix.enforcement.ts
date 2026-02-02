/**
 * Move13: Tenant Matrix Enforcement Helper (SSOT)
 *
 * Enforces access to pages/surfaces using TENANT_FEATURE_MATRIX templates:
 * - enabled_pages[] : page/surface keys
 * - enabled_capabilities[] : capability keys
 *
 * Must stay ports-only (no cross-boundary imports).
 */
import { getEnabledCapabilitiesForPlan, getEnabledPagesForPlan } from "../ssot/tenantMatrixLoader";
import type { ReasonCode } from "./reasonCodes.v1";

export type TenantMatrixDecision = Readonly<{
  allow: boolean;
  reasonCode: ReasonCode;
}>;

function has(arr: readonly string[] | null | undefined, key: string): boolean {
  return Array.isArray(arr) && arr.includes(key);
}

function planFromTenantId(tenantId: string): "FREE" | "PRO" | "ENTERPRISE" {
  const t = String(tenantId || "").toLowerCase();
  if (t.includes("enterprise")) return "ENTERPRISE";
  if (t.includes("pro")) return "PRO";
  return "FREE";
}

export function enforceTenantMatrix(params: {
  tenantId: string;
  requiredPage?: string;       // e.g. "cp.settings"
  requiredCapability?: string; // e.g. "canAdminEntitlements"
}): TenantMatrixDecision {
  const plan = planFromTenantId(params.tenantId);
  const caps = getEnabledCapabilitiesForPlan(plan);
  const pages = getEnabledPagesForPlan(plan);

  // Capability gate (strongest, deterministic)
  if (params.requiredCapability && !has(caps, params.requiredCapability)) {
    return { allow: false, reasonCode: "ERR_CAPABILITY_DISABLED" };
  }

  // Page gate.
  if (params.requiredPage && !has(pages, params.requiredPage)) {
    return { allow: false, reasonCode: "ERR_PAGE_DISABLED" };
  }

  return { allow: true, reasonCode: "OK_POLICY_ALLOW" };
}
