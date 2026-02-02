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

const activationState = new Map<string, boolean>();

function keyOf(tenantId: TenantId, moduleId: ModuleId): string {
  return `${tenantId}::${moduleId}`;
}

/**
 * Default APP-boundary facade factory used by CP bootstrap wiring.
 * This in-memory implementation is deterministic and side-effect local.
 */
export function createActivationRegistryFacade(): ActivationRegistryFacade {
  return {
    async isEnabled(tenantId: TenantId, moduleId: ModuleId): Promise<ActivationDecision> {
      const enabled = activationState.get(keyOf(tenantId, moduleId)) === true;
      return { enabled, reason: enabled ? "OK_ENABLED" : "ERR_DISABLED" };
    },
    async setEnabled(cmd: ActivationWrite): Promise<void> {
      activationState.set(keyOf(cmd.tenantId, cmd.moduleId), !!cmd.enabled);
    },
    async listEnabled(tenantId: TenantId): Promise<ModuleId[]> {
      const out: ModuleId[] = [];
      for (const [k, enabled] of activationState.entries()) {
        if (!enabled) continue;
        const [t, m] = k.split("::");
        if (t === tenantId && m) out.push(m);
      }
      return out;
    },
  };
}
