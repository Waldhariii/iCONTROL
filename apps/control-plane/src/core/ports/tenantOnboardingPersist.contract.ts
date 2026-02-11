// contract-first: persisted onboarding state (WaveA Move2)
export const TENANT_ONBOARDING_PERSIST_CONTRACT_ID = "tenant-onboarding.persist.v1" as const;

export type PersistKey = "tenantOnboardingState" | "tenantOnboardingAudit";

export interface TenantOnboardingPersistPort {
  contractId: typeof TENANT_ONBOARDING_PERSIST_CONTRACT_ID;
  put(key: PersistKey, value: unknown): Promise<void>;
  get<T = unknown>(key: PersistKey): Promise<T | null>;
  snapshot(label: string): Promise<string>;
  rollback(snapshotId: string): Promise<void>;
}
