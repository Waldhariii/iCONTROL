/**
 * Tenant Onboarding (SSOT)
 * - Deterministic creation/initialization path
 * - No network I/O
 * - Returns stable identifiers for downstream entitlements/billing binding
 */
export type TenantKey = string;

export type TenantRecord = {
  tenantId: string;
  tenantKey: TenantKey;
  createdAtUtc: string;
  source: "onboarding";
};

export type OnboardTenantInput = {
  tenantKey: TenantKey;
  actorId: string;
  nowUtc: string;
};

export type OnboardTenantResult =
  | { ok: true; tenant: TenantRecord }
  | { ok: false; reason: "ERR_TENANT_KEY_INVALID" | "ERR_TENANT_ALREADY_EXISTS" | "ERR_RUNTIME_IDENTITY_UNAVAILABLE" };

export interface TenantOnboardingPort {
  onboardTenant(input: OnboardTenantInput): Promise<OnboardTenantResult>;
}
