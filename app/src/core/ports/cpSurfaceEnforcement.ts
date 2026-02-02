/**
 * CP Surface Enforcement — v1
 * Boundary-safe: depends only on app ports index + contracts, never core-kernel concrete impl imports.
 */
import { getCpEnforcement } from "./cpEnforcement.bootstrap";
import type { PolicyContext } from "./policyEngine.facade";

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
  const { policy } = getCpEnforcement();

  // PolicyContext is a facade-level type; keep it minimal and serializable.
  const ctx: PolicyContext = {
    tenantId: input.tenantId,
    actorId: input.actorId,
    surface: input.surfaceKey,
    action: input.action,
    resource: input.resource,
  };

  return policy.evaluate(ctx);
}
