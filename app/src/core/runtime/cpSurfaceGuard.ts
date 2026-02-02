/**
 * Move14: CP Surface Guard (single entry point)
 *
 * Goal: centralize CP surface access enforcement:
 * - tenant matrix (pages/capabilities) via ports helper
 * - policy engine decisions if needed (future)
 * - returns redirect path + reason codes (frozen)
 *
 * Must be runtime-safe (node tests) and policy-compliant (no raw window.location.hash writes).
 */
import { enforceTenantMatrix } from "../ports/tenantMatrix.enforcement";
import type { ReasonCode } from "../ports/reasonCodes.v1";

export type CpSurfaceGuardDecision = Readonly<{
  allow: boolean;
  reasonCode: ReasonCode;
  redirectTo: string | null;
}>;

/**
 * Canonical mapping (SSOT-ish):
 * - surfaceKey: "cp.users" | "cp.settings" | ...
 * - requiredCapability: if surface needs a specific cap (e.g. admin entitlements)
 */
export function guardCpSurface(params: {
  tenantId: string | null | undefined;
  actorId: string | null | undefined;
  surfaceKey: string;              // e.g. "cp.users"
  requiredCapability?: string;     // e.g. "canAdminEntitlements"
}): CpSurfaceGuardDecision {
  if (!params.tenantId || !params.actorId) {
    return { allow: false, reasonCode: "ERR_RUNTIME_IDENTITY_UNAVAILABLE", redirectTo: "/cp/#/blocked" };
  }

  const tm = enforceTenantMatrix({
    tenantId: params.tenantId,
    requiredPage: params.surfaceKey,
    requiredCapability: params.requiredCapability,
  });

  if (!tm.allow) {
    return { allow: false, reasonCode: tm.reasonCode, redirectTo: "/cp/#/blocked" };
  }

  return { allow: true, reasonCode: "OK_POLICY_ALLOW", redirectTo: null };
}
