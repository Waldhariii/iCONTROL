import type { FeatureFlagSet } from "./feature_flags.schema";

export function forceOffMany(base: FeatureFlagSet, keys: readonly string[]): FeatureFlagSet {
  if (!keys || keys.length === 0) return base;
  const flags = { ...(base.flags || {}) };
  for (const k of keys) {
    if (!k || !String(k).trim()) continue;
    flags[String(k)] = { state: "FORCE_OFF" };
  }
  return { flags };
}
