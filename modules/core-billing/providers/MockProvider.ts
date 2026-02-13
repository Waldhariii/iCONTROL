/**
 * MockProvider
 * Provider de paiement fictif pour développement et tests
 * Sauvegarde dans localStorage, pas de vrais paiements
 */

import type { PaymentProvider } from "../types/provider.interface";
import type {
  CheckoutParams,
  CheckoutSessionResult,
  SubscriptionInfo,
  WebhookEvent,
  WebhookResult,
  UpdateSubscriptionParams,
} from "../types/payment.types";

export class MockProvider implements PaymentProvider {
  readonly id = "mock";
  readonly name = "Mock Provider (Dev)";

  private config: Record<string, any> = {};

  async initialize(config: Record<string, any>): Promise<void> {
    this.config = config;
    console.log("[MockProvider] Initialized with config:", config);
  }

  async createCheckoutSession(
    params: CheckoutParams
  ): Promise<CheckoutSessionResult> {
    console.log("[MockProvider] Creating checkout session:", params);

    // En mode mock, on simule un paiement réussi immédiatement
    // Dans la vraie vie, on redirigerait vers une page Stripe/PayPal
    const sessionId = `mock_session_${Date.now()}`;

    // Simuler la création d'une subscription
    const subscription: SubscriptionInfo = {
      id: `mock_sub_${Date.now()}`,
      tenantId: params.tenantId,
      planId: params.planId,
      status: "active",
      currentPeriodEnd: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      cancelAtPeriodEnd: false,
    };

    // Sauvegarder dans localStorage
    const subscriptions = JSON.parse(
      localStorage.getItem("mock_subscriptions") || "[]"
    );
    subscriptions.push(subscription);
    localStorage.setItem("mock_subscriptions", JSON.stringify(subscriptions));

    return {
      success: true,
      sessionId,
      checkoutUrl: params.successUrl, // Redirect immédiat vers success
    };
  }

  async getSubscription(
    subscriptionId: string
  ): Promise<SubscriptionInfo | null> {
    const subscriptions = JSON.parse(
      localStorage.getItem("mock_subscriptions") || "[]"
    );
    return subscriptions.find((s: SubscriptionInfo) => s.id === subscriptionId) || null;
  }

  async updateSubscription(
    subscriptionId: string,
    params: UpdateSubscriptionParams
  ): Promise<SubscriptionInfo> {
    console.log("[MockProvider] Updating subscription:", subscriptionId, params);

    const subscriptions = JSON.parse(
      localStorage.getItem("mock_subscriptions") || "[]"
    );
    const index = subscriptions.findIndex(
      (s: SubscriptionInfo) => s.id === subscriptionId
    );

    if (index === -1) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    subscriptions[index].planId = params.newPlanId;
    localStorage.setItem("mock_subscriptions", JSON.stringify(subscriptions));

    return subscriptions[index];
  }

  async cancelSubscription(
    subscriptionId: string,
    immediate = false
  ): Promise<void> {
    console.log("[MockProvider] Canceling subscription:", subscriptionId, { immediate });

    const subscriptions = JSON.parse(
      localStorage.getItem("mock_subscriptions") || "[]"
    );
    const index = subscriptions.findIndex(
      (s: SubscriptionInfo) => s.id === subscriptionId
    );

    if (index !== -1) {
      if (immediate) {
        subscriptions[index].status = "canceled";
      } else {
        subscriptions[index].cancelAtPeriodEnd = true;
      }
      localStorage.setItem("mock_subscriptions", JSON.stringify(subscriptions));
    }
  }

  async handleWebhook(event: WebhookEvent): Promise<WebhookResult> {
    console.log("[MockProvider] Handling webhook:", event);

    // En mode mock, pas de webhooks réels
    return {
      handled: true,
      actions: [],
    };
  }

  isConfigured(): boolean {
    return true; // Mock est toujours configuré
  }
}
