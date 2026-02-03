import type { BillingHookPort, BillingBindInput, BillingBindResult } from "./billingHook.contract";

/**
 * Stub billing: always returns free and records an explicit note.
 * Paid providers can replace this implementation via ports binding later.
 */
export function makeBillingHookFacade(): BillingHookPort {
  return {
    async bindBillingForTenant(input: BillingBindInput): Promise<BillingBindResult> {
      void input; // contract-visible no-op
      return { ok: true, plan: "free", note: "billing-stub: no external provider configured" };
    },
  };
}
