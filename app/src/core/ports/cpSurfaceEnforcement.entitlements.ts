/**
 * Move12: CP Surface Enforcement — Entitlements/Settings (ports-only)
 *
 * Goal:
 * - Keep surface pages dumb.
 * - Enforce via ports bootstrap/bind flow.
 * - Produce deterministic allow/deny + reasonCode + governed redirect.
 */
import { bindCpEnforcement } from "./cpEnforcement.wiring";
import { bootstrapCpEnforcement } from "./cpEnforcement.bootstrap";
import type { Decision } from "../../policies/feature_flags.types"; // if exists; else we treat as unknown

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
  // Bind (strictly ports bootstrap/bind) — no direct impl imports
  const deps = bootstrapCpEnforcement();
  const enforcement = bindCpEnforcement(deps);

  // Runtime identity (Move11) must be present in strict prod path
  const tenantId = params.tenantId ?? enforcement.identity.tryGet()?.tenantId ?? null;
  const actorId = params.actorId ?? enforcement.identity.tryGet()?.actorId ?? null;

  if (!tenantId || !actorId) {
    // governedRedirect v2 compliant should be used by caller; here we just signal
    return { allow: false, reasonCode: "ERR_RUNTIME_IDENTITY_UNAVAILABLE", redirectTo: "/cp/#/login" };
  }

  // Minimal policy: require capability that allows admin entitlements
  // We rely on existing policy capability naming already enforced elsewhere (contract tests exist).
  const decision = enforcement.policy.evaluate({
    tenantId,
    actorId,
    appKind: "CP",
    surface: "settings",
    action: "admin.entitlements",
    resource: "entitlements",
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
