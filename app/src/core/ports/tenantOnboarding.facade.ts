import type { TenantOnboardingPort, OnboardTenantInput, OnboardTenantResult, TenantRecord } from "./tenantOnboarding.contract";

/**
 * Deterministic, in-memory onboarding facade (contract-only).
 * Real persistence is intentionally NOT introduced here (Phase7 Move2 candidate).
 */
const DB = new Map<string, TenantRecord>();

function isValidTenantKey(k: string): boolean {
  return typeof k === "string" && k.trim().length >= 3 && /^[a-z0-9][a-z0-9._-]+$/i.test(k.trim());
}

export function makeTenantOnboardingFacade(): TenantOnboardingPort {
  return {
    async onboardTenant(input: OnboardTenantInput): Promise<OnboardTenantResult> {
      if (!input || !isValidTenantKey(input.tenantKey)) return { ok: false, reason: "ERR_TENANT_KEY_INVALID" };
      // actorId is required but we keep validation minimal to avoid blocking
      if (!input.actorId || !String(input.actorId).trim()) return { ok: false, reason: "ERR_RUNTIME_IDENTITY_UNAVAILABLE" };

      const key = input.tenantKey.trim();
      if (DB.has(key)) return { ok: false, reason: "ERR_TENANT_ALREADY_EXISTS" };

      const tenant: TenantRecord = {
        tenantId: `t_${key}`,
        tenantKey: key,
        createdAtUtc: input.nowUtc,
        source: "onboarding",
      };
      DB.set(key, tenant);
      return { ok: true, tenant };
    },
  };
}
