import type { BillingHookPort, BillingBindInput, BillingBindResult } from "./billingHook.contract";

export function makeBillingHookFacade(): BillingHookPort {
  return {
    async bindBillingForTenant(input: BillingBindInput): Promise<BillingBindResult> {
      void input;
      return { ok: true, plan: "free", note: "billing-stub: no external provider configured" };
    },
  };
}
