/**
 * Interface PaymentProvider
 * Tout provider de paiement doit implémenter cette interface
 */

import type {
  CheckoutParams,
  CheckoutSessionResult,
  SubscriptionInfo,
  WebhookEvent,
  WebhookResult,
  UpdateSubscriptionParams,
} from "./payment.types";

export interface PaymentProvider {
  /**
   * Identifiant unique du provider
   */
  readonly id: string;

  /**
   * Nom d'affichage du provider
   */
  readonly name: string;

  /**
   * Initialiser le provider avec sa configuration
   */
  initialize(config: Record<string, any>): Promise<void>;

  /**
   * Créer une session de checkout (redirect vers page paiement)
   */
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutSessionResult>;

  /**
   * Récupérer les infos d'une subscription
   */
  getSubscription(subscriptionId: string): Promise<SubscriptionInfo | null>;

  /**
   * Mettre à jour une subscription (changement de plan)
   */
  updateSubscription(
    subscriptionId: string,
    params: UpdateSubscriptionParams
  ): Promise<SubscriptionInfo>;

  /**
   * Annuler une subscription
   */
  cancelSubscription(
    subscriptionId: string,
    immediate?: boolean
  ): Promise<void>;

  /**
   * Gérer un webhook du provider
   */
  handleWebhook(event: WebhookEvent): Promise<WebhookResult>;

  /**
   * Vérifier que le provider est correctement configuré
   */
  isConfigured(): boolean;
}
