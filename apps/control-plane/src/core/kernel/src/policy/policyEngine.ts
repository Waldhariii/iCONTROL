export type Action = string;
export type Resource = string;

export interface PolicyContext {
  tenantId: string;
  actorId?: string;
  role?: string;
  entitlements?: Record<string, boolean>;
  attributes?: Record<string, unknown>;
}

export interface PolicyDecision {
  allow: boolean;
  reason: string; // ERR_* / OK / WARN_*
}

export interface PolicyEngine {
  decide(action: Action, resource: Resource, ctx: PolicyContext): PolicyDecision;
}

export function createDefaultPolicyEngine(): PolicyEngine {
  return {
    decide(action, _resource, ctx) {
      if (action.startsWith("read")) return { allow: true, reason: "OK" };
      const canWrite = Boolean(ctx.entitlements?.["write"] ?? false);
      return canWrite
        ? { allow: true, reason: "OK" }
        : { allow: false, reason: "ERR_POLICY_DENY" };
    },
  };
}
