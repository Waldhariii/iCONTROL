/**
 * Billing Hook (stub)
 * - NO external calls in core
 * - Provides a contract boundary so paid providers can replace later
 */
import type { TenantRecord } from "./tenantOnboarding.contract";
import type { EntitlementsSnapshot } from "./defaultEntitlements.contract";

export type BillingPlan = "free" | "pro" | "enterprise" | "unknown";

export type BillingBindInput = {
  tenant: TenantRecord;
  entitlements: EntitlementsSnapshot;
  nowUtc: string;
};

export type BillingBindResult =
  | { ok: true; plan: BillingPlan; note: string }
  | { ok: false; reason: "ERR_BILLING_NOT_CONFIGURED" | "ERR_BILLING_BIND_FAILED" };

export interface BillingHookPort {
  bindBillingForTenant(input: BillingBindInput): Promise<BillingBindResult>;
}
