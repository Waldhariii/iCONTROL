import type { TenantOnboardingPort, OnboardTenantInput, OnboardTenantResult, TenantRecord } from "./tenantOnboarding.contract";
import type { VfsPort } from "./vfs.contract";
import type { SnapshotPort } from "./snapshot.contract";
import { storeGetTenant, storePutTenant } from "../onboarding/onboardingStore";

function isValidTenantKey(k: string): boolean {
  return typeof k === "string" && k.trim().length >= 3 && /^[a-z0-9][a-z0-9._-]+$/i.test(k.trim());
}

type Deps = { vfs: VfsPort; snapshot: SnapshotPort };

export function makeTenantOnboardingPersistedFacade(deps: Deps): TenantOnboardingPort {
  return {
    async onboardTenant(input: OnboardTenantInput): Promise<OnboardTenantResult> {
      if (!input || !isValidTenantKey(input.tenantKey)) return { ok: false, reason: "ERR_TENANT_KEY_INVALID" };
      if (!input.actorId || !String(input.actorId).trim()) return { ok: false, reason: "ERR_RUNTIME_IDENTITY_UNAVAILABLE" };

      const key = input.tenantKey.trim();
      const existing = await storeGetTenant(deps, key);
      if (existing) return { ok: false, reason: "ERR_TENANT_ALREADY_EXISTS" };

      const tenant: TenantRecord = {
        tenantId: `t_${key}`,
        tenantKey: key,
        createdAtUtc: input.nowUtc,
        source: "onboarding",
      };

      const put = await storePutTenant(deps, tenant);
      if (!put.ok) {
        return { ok: false, reason: "ERR_RUNTIME_IDENTITY_UNAVAILABLE" };
      }
      return { ok: true, tenant };
    },
  };
}
