/**
 * Activation Registry — Contract (v1)
 * Core-owned. Implementations must be injected via ports/adapters.
 */
export type TenantId = string;
export type ModuleId = string;

export type ActivationDecision = {
  enabled: boolean;
  reason?: string;
};

export type ActivationWrite = {
  tenantId: TenantId;
  moduleId: ModuleId;
  enabled: boolean;
  actorId: string;
  correlationId: string;
  reason?: string;
};

export interface ActivationRegistryPort {
  isEnabled(tenantId: TenantId, moduleId: ModuleId): Promise<ActivationDecision>;
  setEnabled(cmd: ActivationWrite): Promise<void>;
  listEnabled(tenantId: TenantId): Promise<ModuleId[]>;
}
