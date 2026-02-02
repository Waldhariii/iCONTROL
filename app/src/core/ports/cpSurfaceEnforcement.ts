/**
 * CP Surface Enforcement — v1
 * Boundary-safe: depends only on app ports index + contracts, never core-kernel concrete impl imports.
 */
import { bindPolicyEngine, bootstrapCpEnforcement } from "./index";
import type { PolicyDecision } from "./policyEngine.facade";

/**
 * Enforce access for a CP surface key.
 * Returns a decision with stable reason codes.
 */
export async function enforceCpSurfaceAccess(input: {
  tenantId: string;
  actorId: string;
  surfaceKey: string;  // ex: "cp.users"
  action: string;      // ex: "read" | "write"
  resource: string;    // ex: "users"
}): Promise<{ allow: boolean; reason: string }> {
  let policy = null as ReturnType<typeof bindPolicyEngine> | null;
  try {
    policy = bindPolicyEngine();
  } catch {
    // Lazy bootstrap for tests and environments that did not register deps yet.
    bootstrapCpEnforcement();
    policy = bindPolicyEngine();
  }

  const decision: PolicyDecision = policy.evaluate({
    tenantId: input.tenantId,
    subject: { actorId: input.actorId, role: "admin" },
    action: input.action,
    resource: { kind: input.resource, id: input.surfaceKey },
    context: { surface: input.surfaceKey },
  });

  if (decision.allow) {
    return { allow: true, reason: decision.reasons[0] ?? "OK_POLICY_ALLOW" };
  }
  return { allow: false, reason: decision.code || decision.reasons[0] || "ERR_POLICY_DENY" };
}
