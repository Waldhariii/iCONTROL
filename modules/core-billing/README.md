# Module core-billing

Système de facturation multi-provider pour iCONTROL.

## 🎯 Objectif

Permettre de changer de provider de paiement (Stripe, PayPal, Paddle, etc.) sans modifier le code métier.

## 🏗️ Architecture
```
core-billing/
├── types/              # Types TypeScript
├── providers/          # Providers de paiement
│   ├── MockProvider    # Mock (dev/test)
│   ├── StripeProvider  # Stripe (à implémenter)
│   └── ...             # Autres providers
├── BillingService.ts   # Service principal
├── config.ts           # Configuration
└── index.ts            # Exports
```

## 🚀 Usage

### Initialiser le service
```typescript
import { BillingService, BILLING_CONFIG } from "@modules/core-billing";

// Initialiser au démarrage de l'app
await BillingService.initialize(BILLING_CONFIG);
```

### Créer une session de paiement
```typescript
const result = await BillingService.createCheckoutSession({
  tenantId: "acme-corp",
  planId: "PRO",
  successUrl: "https://app.com/success",
  cancelUrl: "https://app.com/cancel",
});

if (result.success) {
  window.location.href = result.checkoutUrl;
}
```

### Changer de provider
```typescript
// En développement
await BillingService.switchProvider("mock");

// En production
await BillingService.switchProvider("stripe");
```

## 🔧 Configuration

Modifier `config.ts` pour changer de provider :
```typescript
export const BILLING_CONFIG = {
  activeProvider: "stripe", // mock | stripe | paypal | paddle
  providers: {
    stripe: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
};
```

## 📦 Ajouter un nouveau provider

1. Créer `providers/MyProvider.ts`
2. Implémenter l'interface `PaymentProvider`
3. Ajouter dans `BillingService.initialize()`
4. Ajouter config dans `config.ts`

## 🧪 Mode Mock (Développement)

Le `MockProvider` sauvegarde dans localStorage :
- Pas de vrais paiements
- Simulation instantanée
- Parfait pour développement

## 🔐 Mode Production

Utiliser Stripe, PayPal, ou Paddle :
1. Décommenter le provider dans `config.ts`
2. Ajouter les clés API dans `.env`
3. Implémenter les méthodes du provider
4. Changer `activeProvider`
