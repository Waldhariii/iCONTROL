/**
 * Move12: CP Surface Enforcement — Entitlements/Settings (ports-only)
 *
 * Goal:
 * - Keep surface pages dumb.
 * - Enforce via ports bootstrap/bind flow.
 * - Produce deterministic allow/deny + reasonCode + governed redirect.
 */
import { bindPolicyEngine, bootstrapCpEnforcement } from "./index";
import { createRuntimeIdentityPort } from "../runtime/runtimeIdentity.impl";
import { enforceTenantMatrix } from "./tenantMatrix.enforcement";

export type CpSurfaceCheckResult = Readonly<{
  allow: boolean;
  reasonCode: string;
  redirectTo: string | null;
}>;

export async function enforceCpEntitlementsSurface(params: {
  tenantId?: string;
  actorId?: string;
  appKind?: "CP" | "APP";
}): Promise<CpSurfaceCheckResult> {
  // Ensure deps are registered before binding policy.
  try {
    bindPolicyEngine();
  } catch {
    bootstrapCpEnforcement();
  }
  const policy = bindPolicyEngine();
  const identity = createRuntimeIdentityPort().tryGet();

  // Runtime identity (Move11) must be present in strict prod path.
  const tenantId = params.tenantId ?? identity?.tenantId ?? null;
  const actorId = params.actorId ?? identity?.actorId ?? null;

  
  // Move13: tenant matrix enforcement (SSOT)
  const tm = enforceTenantMatrix({
    tenantId,
    requiredPage: "cp.settings",
    requiredCapability: "canAdminEntitlements",
  });
  if (!tm.allow) {
    return { allow: false, reasonCode: tm.reasonCode, redirectTo: "/cp/#/blocked" };
  }

if (!tenantId || !actorId) {
    // governedRedirect v2 compliant should be used by caller; here we just signal
    return { allow: false, reasonCode: "ERR_RUNTIME_IDENTITY_UNAVAILABLE", redirectTo: "/cp/#/login" };
  }

  // Minimal policy: require capability that allows admin entitlements
  // We rely on existing policy capability naming already enforced elsewhere (contract tests exist).
  const decision = policy.evaluate({
    tenantId,
    actorId,
    subject: { actorId, role: "admin" },
    action: "entitlements.write",
    resource: { kind: "entitlements", id: "settings" },
    context: { appKind: params.appKind ?? "CP", surface: "settings" },
  });

  if (decision?.allow) {
    return { allow: true, reasonCode: decision.reason ?? "OK_POLICY_ALLOW", redirectTo: null };
  }

  return {
    allow: false,
    reasonCode: decision?.reason ?? "ERR_POLICY_DENY",
    redirectTo: "/cp/#/blocked",
  };
}
