import { TENANT_ONBOARDING_PERSIST_CONTRACT_ID, TenantOnboardingPersistPort, PersistKey } from "./tenantOnboardingPersist.contract";

// NOTE: This facade composes VFS + Snapshot through already-governed providers.
// Keep runtime-safe (Node/Vitest) and side-effect free.
export function makeTenantOnboardingPersistedFacade(deps: {
  vfs: { putJson(path: string, value: unknown): Promise<void>; getJson<T>(path: string): Promise<T | null>; };
  snapshot: { create(label: string): Promise<string>; rollback(id: string): Promise<void>; };
}): TenantOnboardingPersistPort {
  const base = "tenant/onboarding";
  const keyToPath = (k: PersistKey) => `${base}/${k}.json`;

  return {
    contractId: TENANT_ONBOARDING_PERSIST_CONTRACT_ID,
    async put(key, value) { await deps.vfs.putJson(keyToPath(key), value); },
    async get(key) { return await deps.vfs.getJson(keyToPath(key)); },
    async snapshot(label) { return await deps.snapshot.create(label); },
    async rollback(id) { return await deps.snapshot.rollback(id); },
  };
}
