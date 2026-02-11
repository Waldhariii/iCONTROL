import { BILLING_SINK_CONTRACT_ID, BillingEventV1, BillingSinkPort } from "./billingSink.contract";

// Default sink = no-op + idempotency memory (in-process).
// Paid module can replace this binding with a real provider (Stripe/etc).
export function makeBillingSinkFacade(): BillingSinkPort {
  const seen = new Set<string>();
  return {
    contractId: BILLING_SINK_CONTRACT_ID,
    async emit(evt: BillingEventV1) {
      if (!evt?.eventId) throw new Error("ERR_BILLING_EVENT_ID_REQUIRED");
      if (seen.has(evt.eventId)) return;
      seen.add(evt.eventId);
      // no-op core
    },
  };
}
