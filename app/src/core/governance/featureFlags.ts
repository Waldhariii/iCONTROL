export type FeatureFlag =
  | "ADVANCED_OCR"
  | "FINANCIAL_ANALYTICS"
  | "AUTOMATED_ADVICE"
  | "ENTERPRISE_AUDIT";

const flags: Partial<Record<FeatureFlag, boolean>> = {};

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return flags[flag] === true;
}

// Future-proof (commercial hook)
export function enableFeature(flag: FeatureFlag) {
  flags[flag] = true;
}
