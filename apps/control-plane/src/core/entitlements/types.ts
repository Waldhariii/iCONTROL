export type Plan = "FREE" | "PRO" | "ENTERPRISE";

export type Entitlements = {
  plan: Plan;
  // Toggleable modules/features. Keep keys stable (acts as API).
  modules: Record<string, boolean>;
  // Optional expiry (epoch ms). If expired => FREE.
  expiresAtMs?: number;
};

export const DEFAULT_ENTITLEMENTS: Entitlements = {
  plan: "FREE",
  modules: {},
};
