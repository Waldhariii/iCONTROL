export type SubscriptionTier = "free" | "pro" | "business" | "enterprise";

/**
 * Capabilities are the ONLY thing the rest of the system should query.
 */
export type Capabilities = {
  canUseCore: true;
  canUseAdvancedDashboards: boolean;
  canUseAutomation: boolean;
  canUseOCR: boolean;
  canUsePremiumModules: boolean;
  canAdminGlobalTheme: boolean;
  canAdminEntitlements: boolean;
};

export type EntitlementsContext = {
  tenantId: string;
  role: "owner" | "admin" | "manager" | "user" | "viewer";
  tier: SubscriptionTier;
  features?: Record<string, boolean>;
};
