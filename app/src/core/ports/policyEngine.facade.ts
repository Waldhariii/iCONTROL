/**
 * Policy Engine Facade (APP/CP boundary-safe)
 * NOTE: This file must not import core-kernel directly (STRUCTURE_BOUNDARIES).
 */
export type TenantId = string;
export type Subject = { actorId: string; role: string };
export type Action = string;
export type Resource = { kind: string; id?: string };
export type PolicyContext = Record<string, unknown>;

export type PolicyDecision =
  | { allow: true; reasons: string[] }
  | { allow: false; reasons: string[]; code: string };

export interface PolicyEngineFacade {
  evaluate(input: {
    tenantId: TenantId;
    subject: Subject;
    action: Action;
    resource: Resource;
    context?: PolicyContext;
  }): PolicyDecision;
}

/**
 * Default APP-boundary facade factory used by CP bootstrap wiring.
 * Conservative baseline: deny writes for non-admin roles.
 */
export function createPolicyEngineFacade(): PolicyEngineFacade {
  return {
    evaluate(input): PolicyDecision {
      const role = String(input.subject?.role || "").toLowerCase();
      const action = String(input.action || "").toLowerCase();
      const isWrite = action.includes("write") || action.includes("set") || action.includes("toggle");

      if (isWrite && role !== "admin" && role !== "owner") {
        return { allow: false, reasons: ["ERR_POLICY_DENY_ROLE"], code: "ERR_POLICY_DENY_ROLE" };
      }
      return { allow: true, reasons: ["OK_POLICY_ALLOW"] };
    },
  };
}
