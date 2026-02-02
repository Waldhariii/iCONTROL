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
