/**
 * Capability-Based Security — Contract First
 * Objectif: extensions et modules s'exécutent avec un modèle "least privilege".
 */

export type Capability =
  | "storage.read"
  | "storage.write"
  | "jobs.read"
  | "jobs.write"
  | "billing.read"
  | "billing.write"
  | "ai.invoke"
  | "observability.emit";

export type CapabilityGrant = {
  tenantId: string;
  principalId: string; // user/service/extension
  capabilities: Capability[];
};

export interface CapabilityPolicy {
  has(grant: CapabilityGrant, cap: Capability): boolean;
}
