import defaults from "./feature_flags.default.json";
import { isFeatureFlagSet, type FeatureFlagSet } from "./feature_flags.schema";
import { ERROR_CODES } from "../core/errors/error_codes";

export type AuditEvent = { level: "INFO" | "WARN" | "ERR"; code: string; message: string };

export function loadFeatureFlags(override?: unknown): {
  source: "default" | "override";
  flags: FeatureFlagSet;
  audit: AuditEvent[];
} {
  const audit: AuditEvent[] = [];

  const def = defaults as unknown;
  const fallback: FeatureFlagSet = isFeatureFlagSet(def) ? (def as FeatureFlagSet) : { flags: {} };

  if (override === undefined) {
    return { source: "default", flags: fallback, audit };
  }

  if (isFeatureFlagSet(override)) {
    return { source: "override", flags: override, audit };
  }

  audit.push({
    level: "WARN",
    code: ERROR_CODES.WARN_FLAG_INVALID ?? "WARN_FLAG_INVALID",
    message: "Invalid feature flags override; falling back to defaults",
  });
  return { source: "default", flags: fallback, audit };
}
