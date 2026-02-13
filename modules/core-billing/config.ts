/**
 * Configuration du système de billing
 * MODIFIER ICI POUR CHANGER DE PROVIDER
 */

import type { BillingConfig } from "./BillingService";

export const BILLING_CONFIG: BillingConfig = {
  // Provider actif (mock pour dev, stripe/paypal/paddle pour prod)
  activeProvider: "mock",

  // Configuration des providers
  providers: {
    // Mock Provider (toujours disponible)
    mock: {},

    // Stripe (décommenter et remplir quand prêt)
    // stripe: {
    //   apiKey: process.env.STRIPE_SECRET_KEY || "",
    // },

    // PayPal (décommenter et remplir quand prêt)
    // paypal: {
    //   clientId: process.env.PAYPAL_CLIENT_ID || "",
    //   secret: process.env.PAYPAL_SECRET || "",
    // },

    // Paddle (décommenter et remplir quand prêt)
    // paddle: {
    //   vendorId: process.env.PADDLE_VENDOR_ID || "",
    //   apiKey: process.env.PADDLE_API_KEY || "",
    // },
  },
};

/**
 * Pour changer de provider, il suffit de modifier activeProvider :
 * 
 * DÉVELOPPEMENT :
 *   activeProvider: "mock"
 * 
 * PRODUCTION STRIPE :
 *   activeProvider: "stripe"
 *   + Décommenter providers.stripe
 * 
 * PRODUCTION PAYPAL :
 *   activeProvider: "paypal"
 *   + Décommenter providers.paypal
 */
