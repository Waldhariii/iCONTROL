/**
 * Policy Engine — Contract First
 * Objectif: standardiser l'application des politiques (tenant, region, billing, security)
 * sans dépendances vers app/ ou modules.
 */

export type PolicyScope = "tenant" | "region" | "billing" | "security" | "ops";

export type PolicyDecision = {
  allow: boolean;
  reason?: string;
  tags?: string[];
};

export type PolicyInput = {
  scope: PolicyScope;
  tenantId?: string;
  region?: string;
  actorRole?: string;
  action: string;
  resource: string;
  context?: Record<string, unknown>;
};

export interface PolicyEngine {
  evaluate(input: PolicyInput): PolicyDecision;
}
