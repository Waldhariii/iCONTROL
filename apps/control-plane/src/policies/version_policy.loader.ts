import defaultPolicyJson from "./version_policy.default.json";
import { isVersionPolicy, type VersionPolicy } from "./version_policy.schema";
import { ERROR_CODES } from "../core/errors/error_codes";

// NOTE: keep this loader offline-first and deterministic.
// No network. No side effects. Any policy invalidity must fall back safely.

export type VersionPolicyLoadResult = {
  policy: VersionPolicy;
  source: "default" | "override";
  audit: Array<{
    level: "INFO" | "WARN";
    code: string;
    message: string;
  }>;
};

/**
 * Load the active Version Policy.
 * - If override is provided and valid => use it.
 * - Otherwise fall back to bundled default policy.
 *
 * This function must be pure (no storage writes, no navigation).
 */
export function loadVersionPolicy(override?: unknown): VersionPolicyLoadResult {
  const audit: VersionPolicyLoadResult["audit"] = [];

  // 1) Try override
  if (override !== undefined) {
    if (isVersionPolicy(override)) {
      audit.push({
        level: "INFO",
        code: "INFO_POLICY_OVERRIDE_APPLIED",
        message: "Version policy override applied.",
      });
      return { policy: override, source: "override", audit };
    }

    audit.push({
      level: "WARN",
      code: ERROR_CODES.WARN_POLICY_INVALID,
      message: "Invalid version policy override; falling back to default.",
    });
  }

  // 2) Default policy (bundled)
  const defaultCandidate = defaultPolicyJson as unknown;
  if (isVersionPolicy(defaultCandidate)) {
    return { policy: defaultCandidate, source: "default", audit };
  }

  // 3) Even default is invalid => hard safe fallback (never crash)
  audit.push({
    level: "WARN",
    code: ERROR_CODES.WARN_POLICY_INVALID,
    message: "Bundled default version policy is invalid; using hard-coded safe fallback.",
  });

  const safeFallback: VersionPolicy = {
    status: "OK",
    min_version: "0.0.0",
    latest_version: "0.0.0",
    message: "",
    safe_mode: false,
    capabilities: [],
  };

  return { policy: safeFallback, source: "default", audit };
}
