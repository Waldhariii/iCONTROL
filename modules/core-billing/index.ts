/**
 * Module core-billing
 * Système de facturation multi-provider
 */

// Service principal
export { BillingService } from "./BillingService";

// Configuration
export { BILLING_CONFIG } from "./config";

// Types
export type {
  PlanId,
  Currency,
  Price,
  CheckoutParams,
  CheckoutSessionResult,
  SubscriptionInfo,
  WebhookEvent,
  WebhookResult,
  UpdateSubscriptionParams,
} from "./types/payment.types";

export type { PaymentProvider } from "./types/provider.interface";

// Providers (si besoin d'accès direct)
export { MockProvider } from "./providers/MockProvider";
export { StripeProvider } from "./providers/StripeProvider";
