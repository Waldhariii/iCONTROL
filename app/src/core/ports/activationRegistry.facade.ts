/**
 * Activation Registry Facade (APP/CP boundary-safe)
 * NOTE: This file must not import core-kernel directly (STRUCTURE_BOUNDARIES).
 * It delegates to existing CP activation implementation already within app boundary.
 */
export type TenantId = string;
export type ModuleId = string;

export type ActivationDecision = { enabled: boolean; reason?: string };

export type ActivationWrite = {
  tenantId: TenantId;
  moduleId: ModuleId;
  enabled: boolean;
  actorId: string;
  correlationId: string;
  reason?: string;
};

export interface ActivationRegistryFacade {
  isEnabled(tenantId: TenantId, moduleId: ModuleId): Promise<ActivationDecision>;
  setEnabled(cmd: ActivationWrite): Promise<void>;
  listEnabled(tenantId: TenantId): Promise<ModuleId[]>;
}
