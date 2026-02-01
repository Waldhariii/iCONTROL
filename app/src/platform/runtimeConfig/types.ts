export type RuntimeMode = "prod" | "dev" | "test";

export type SubscriptionTier = "free" | "pro" | "business" | "enterprise";
export type AppKind = "APP" | "CP";

export type RuntimeConfigMeta = {
  schemaVersion: number;
  source: "runtime" | "example" | "default";
  filePath?: string;
  sha256?: string;
  loadedAt: string; // ISO
  mode: RuntimeMode;
};

export type SubscriptionPlan = {
  tier: SubscriptionTier;
  // Feature flags/capabilities toggled by subscription (kernel-friendly)
  features?: Record<string, boolean>;
  modules?: string[];
};

export type RuntimeConfig = {
  schemaVersion: number;

  // Baseline: keep minimal + forward-compatible
  defaultTier: SubscriptionTier;

  // Optional mapping (tenantId -> plan). In baseline, can be empty.
  tenants?: Record<string, SubscriptionPlan>;

  // Optional per-app overrides (APP/CP) if needed later
  appKindOverrides?: Partial<Record<AppKind, Partial<RuntimeConfig>>>;
};

export type LoadedRuntimeConfig = {
  config: RuntimeConfig;
  meta: RuntimeConfigMeta;
};
