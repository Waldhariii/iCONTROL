import type { PolicyDecision, PolicyEngine, PolicyInput } from "@/core/kernel/src/policy/policyEngine.contract";

/**
 * Minimal implementation shim (Ultra scaffold).
 * Future: load rules from registry, schema-registry, tenantOverrides, billing config.
 */
export function createPolicyEngine(): PolicyEngine {
  return {
    evaluate(input: PolicyInput): PolicyDecision {
      // Default allow: conservative gates will tighten over time via policies + budgets.
      if (!input.action || !input.resource) return { allow: false, reason: "missing_action_or_resource" };
      return { allow: true, tags: ["ULTRA_SCaffold"] };
    },
  };
}
