/**
 * CP Surface Enforcement — v1
 * Boundary-safe: depends only on app ports index + contracts, never core-kernel concrete impl imports.
 */
import { bindPolicyEngine, bootstrapCpEnforcement } from "./index";
import { buildCpSurfaceRegistryFromCatalog } from "./cpSurfaceRegistry.catalog";
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
import { getRuntimeIdentity } from "../runtime/identity";
import { governedRedirect } from "../runtime/governedRedirect";

function _resolveIdentity(): { tenantId: string; actorId: string } {
  const id = getRuntimeIdentity();
  return { tenantId: id.tenantId, actorId: id.actorId };
}

/**
 * Helper for surfaces: apply redirect on deny using governed redirect strategy.
 */
export function redirectOnDeny(decision: { allow: boolean; reason: string }, appKind: "CP" | "APP" = "CP"): void {
  if (decision.allow) return;
  governedRedirect({ kind: "blocked", reason: decision.reason });
}

/**
 * Move3: CP surface registry source = MODULE_CATALOG SSOT.
 * Keep this local to ports layer (APP boundary).
 */
export function getCpSurfaceRegistry(): readonly { moduleId: string; surfaceId: string; routes: readonly string[]; capabilities: readonly string[] }[] {
  return buildCpSurfaceRegistryFromCatalog();
}
