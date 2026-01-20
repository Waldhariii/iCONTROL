export const ICONTROL_RUNTIME_CONFIG_KIND = "ICONTROL_RUNTIME_CONFIG_V1" as const;

export type RuntimeConfigV1 = {
  kind: typeof ICONTROL_RUNTIME_CONFIG_KIND;
  version: 1;
  issuedAt: string;
  safeMode?: boolean;
  featureFlags?: Record<string, boolean>;
  modules?: Record<string, { enabled: boolean; tier?: "free" | "pro" | "enterprise" }>;
};

export function makeDefaultRuntimeConfig(): RuntimeConfigV1 {
  return {
    kind: ICONTROL_RUNTIME_CONFIG_KIND,
    version: 1,
    issuedAt: new Date().toISOString(),
    safeMode: false,
    featureFlags: {},
    modules: {},
  };
}
