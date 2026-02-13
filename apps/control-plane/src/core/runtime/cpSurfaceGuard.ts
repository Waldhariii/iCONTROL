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
import { CP_SURFACE_REGISTRY } from "./cpSurfaceRegistry";


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
  const spec = (CP_SURFACE_REGISTRY as any)[params.surfaceKey] as { requiredCapability?: string; denyRedirectTo?: string } | undefined;
  const requiredCapability = params.requiredCapability ?? spec?.requiredCapability;
  const denyRedirectTo = spec?.denyRedirectTo ?? "/cp/#/blocked";


  // Allow local dev with fallback tenant/actor
  const tenantId = params.tenantId || "icontrol-default";
  const actorId = params.actorId || "local-dev-user";
  
  if (!tenantId || !actorId) {
    return { allow: false, reasonCode: "ERR_RUNTIME_IDENTITY_UNAVAILABLE", redirectTo: denyRedirectTo };
  }

  const tm = enforceTenantMatrix({
    tenantId: tenantId,
    requiredPage: params.surfaceKey,
    ...(requiredCapability ? { requiredCapability } : {}),
  });

  if (!tm.allow) {
    return { allow: false, reasonCode: tm.reasonCode, redirectTo: denyRedirectTo };
  }

  return { allow: true, reasonCode: "OK_POLICY_ALLOW", redirectTo: null };
}
