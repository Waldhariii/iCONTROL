import type { LoadedRuntimeConfig, RuntimeConfig, RuntimeConfigMeta } from "../types";

function normalizeConfig(input: Partial<RuntimeConfig>): RuntimeConfig {
  return {
    schemaVersion: input.schemaVersion ?? 1,
    defaultTier: input.defaultTier ?? "free",
    tenants: input.tenants ?? {},
    appKindOverrides: input.appKindOverrides ?? {},
  };
}

export function validateRuntimeConfig<T extends Partial<RuntimeConfig>>(
  x: T,
  meta: RuntimeConfigMeta,
): LoadedRuntimeConfig {
  const config = normalizeConfig(x);
  return {
    config,
    meta: {
      ...meta,
      schemaVersion: config.schemaVersion,
    },
  };
}
