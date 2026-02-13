/**
 * Types universels pour le système de paiement
 * Agnostiques du provider (Stripe, PayPal, etc.)
 */

export type PlanId = "FREE" | "PRO" | "ENTERPRISE";

export type Currency = "USD" | "EUR" | "CAD";

export interface Price {
  amount: number;
  currency: Currency;
  interval: "month" | "year";
}

export interface CheckoutParams {
  tenantId: string;
  planId: PlanId;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

export interface CheckoutSessionResult {
  success: boolean;
  sessionId?: string;
  checkoutUrl?: string;
  error?: string;
}

export interface SubscriptionInfo {
  id: string;
  tenantId: string;
  planId: PlanId;
  status: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface WebhookEvent {
  type: string;
  data: any;
}

export interface WebhookResult {
  handled: boolean;
  actions?: Array<{
    type: "update_plan" | "suspend_tenant" | "send_email";
    payload: any;
  }>;
}

export interface UpdateSubscriptionParams {
  newPlanId: PlanId;
  prorationBehavior?: "create_prorations" | "none" | "always_invoice";
}
