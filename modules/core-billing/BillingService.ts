/**
 * BillingService
 * Service central de facturation qui orchestre les providers
 * Point d'entrée unique pour toutes les opérations de billing
 */

import type { PaymentProvider } from "./types/provider.interface";
import type {
  CheckoutParams,
  CheckoutSessionResult,
  SubscriptionInfo,
  UpdateSubscriptionParams,
  PlanId,
} from "./types/payment.types";
import { MockProvider } from "./providers/MockProvider";
import { StripeProvider } from "./providers/StripeProvider";

type ProviderType = "mock" | "stripe" | "paypal" | "paddle";

export interface BillingConfig {
  activeProvider: ProviderType;
  providers: {
    mock?: Record<string, any>;
    stripe?: { apiKey: string };
    paypal?: { clientId: string; secret: string };
    paddle?: { vendorId: string; apiKey: string };
  };
}

class BillingServiceClass {
  private providers: Map<ProviderType, PaymentProvider> = new Map();
  private activeProvider: PaymentProvider | null = null;
  private config: BillingConfig | null = null;

  /**
   * Initialiser le service avec la configuration
   */
  async initialize(config: BillingConfig): Promise<void> {
    this.config = config;

    // Créer les providers disponibles
    if (config.providers.mock !== undefined) {
      const mockProvider = new MockProvider();
      await mockProvider.initialize(config.providers.mock || {});
      this.providers.set("mock", mockProvider);
    }

    if (config.providers.stripe) {
      const stripeProvider = new StripeProvider();
      await stripeProvider.initialize(config.providers.stripe);
      this.providers.set("stripe", stripeProvider);
    }

    // TODO: Ajouter PayPal, Paddle, etc. quand nécessaire

    // Définir le provider actif
    const activeProvider = this.providers.get(config.activeProvider);
    if (!activeProvider) {
      throw new Error(`Provider ${config.activeProvider} not available`);
    }

    this.activeProvider = activeProvider;
    console.log(`[BillingService] Initialized with provider: ${config.activeProvider}`);
  }

  /**
   * Obtenir le provider actif
   */
  private getProvider(): PaymentProvider {
    if (!this.activeProvider) {
      throw new Error("BillingService not initialized. Call initialize() first.");
    }
    return this.activeProvider;
  }

  /**
   * Créer une session de checkout pour un changement de plan
   */
  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutSessionResult> {
    return this.getProvider().createCheckoutSession(params);
  }

  /**
   * Récupérer les infos d'une subscription
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionInfo | null> {
    return this.getProvider().getSubscription(subscriptionId);
  }

  /**
   * Mettre à jour une subscription (changement de plan)
   */
  async updateSubscription(
    subscriptionId: string,
    params: UpdateSubscriptionParams
  ): Promise<SubscriptionInfo> {
    return this.getProvider().updateSubscription(subscriptionId, params);
  }

  /**
   * Annuler une subscription
   */
  async cancelSubscription(subscriptionId: string, immediate = false): Promise<void> {
    return this.getProvider().cancelSubscription(subscriptionId, immediate);
  }

  /**
   * Changer de provider (ex: mock → stripe)
   */
  async switchProvider(newProvider: ProviderType): Promise<void> {
    const provider = this.providers.get(newProvider);
    if (!provider) {
      throw new Error(`Provider ${newProvider} not configured`);
    }

    if (!provider.isConfigured()) {
      throw new Error(`Provider ${newProvider} is not properly configured`);
    }

    this.activeProvider = provider;
    console.log(`[BillingService] Switched to provider: ${newProvider}`);
  }

  /**
   * Obtenir le provider actif actuel
   */
  getActiveProviderInfo(): { id: string; name: string } {
    const provider = this.getProvider();
    return {
      id: provider.id,
      name: provider.name,
    };
  }

  /**
   * Lister tous les providers disponibles
   */
  getAvailableProviders(): Array<{ id: string; name: string; configured: boolean }> {
    return Array.from(this.providers.values()).map((provider) => ({
      id: provider.id,
      name: provider.name,
      configured: provider.isConfigured(),
    }));
  }
}

// Export singleton
export const BillingService = new BillingServiceClass();
