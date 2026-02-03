// contract-first: billing sink v1 (WaveB Move1)
// - idempotent: repeated same eventId must not double-apply
// - default: no-op sink allowed (free core), paid module can override later
export const BILLING_SINK_CONTRACT_ID = "billing.sink.v1" as const;

export type BillingEventType =
  | "subscription.activated"
  | "subscription.canceled"
  | "invoice.requested"
  | "usage.reported";

export interface BillingEventV1 {
  eventId: string;          // idempotency key (required)
  type: BillingEventType;
  tenantId: string;
  occurredAtUtc: string;    // ISO
  payload: Record<string, unknown>;
}

export interface BillingSinkPort {
  contractId: typeof BILLING_SINK_CONTRACT_ID;
  emit(evt: BillingEventV1): Promise<void>;
}
