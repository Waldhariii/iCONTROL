import {
  isHardBlocked,
  isMaintenance,
  isSoftBlocked,
  loadVersionPolicyFromSources,
  shouldForceSafeMode,
} from "../core/version/versionPolicy";

export type VersionPolicyDecision = {
  status: "OK" | "SOFT_BLOCK" | "HARD_BLOCK" | "MAINTENANCE";
  message: string;
  force_safe_mode: boolean;
};

export function evaluateVersionPolicy(): VersionPolicyDecision {
  const p = loadVersionPolicyFromSources();

  const decision: VersionPolicyDecision = {
    status: p.status,
    message: p.message || "",
    force_safe_mode: shouldForceSafeMode(p),
  };

  // Audit-friendly, side-effect limited to console only.
  if (isHardBlocked(p)) {
    console.warn("WARN_VERSION_POLICY_HARD_BLOCK", decision);
  } else if (isMaintenance(p)) {
    console.warn("WARN_VERSION_POLICY_MAINTENANCE", decision);
  } else if (isSoftBlocked(p)) {
    console.warn("WARN_VERSION_POLICY_SOFT_BLOCK", decision);
  }

  return decision;
}

export type VersionPolicyBootOverride = {
  status?: "OK" | "SOFT_BLOCK" | "HARD_BLOCK" | "MAINTENANCE";
  min_version?: string;
  latest_version?: string;
  message?: string;
  safe_mode?: boolean;
};

export type VersionPolicyBootOutcome = {
  status: "OK" | "SOFT_BLOCK" | "HARD_BLOCK" | "MAINTENANCE";
  message: string;
  force_safe_mode: boolean;
};

/**
 * Boot adapter (contract):
 * - Publishes rt.__versionPolicy
 * - Publishes rt.__bootBanner on SOFT_BLOCK
 * - Publishes rt.__bootBlock on HARD_BLOCK
 * - Never requires billing / network / backend
 */
export type VersionPolicyBootOverride = {
  status?: "OK" | "SOFT_BLOCK" | "HARD_BLOCK" | "MAINTENANCE";
  min_version?: string;
  latest_version?: string;
  message?: string;
  safe_mode?: boolean;
  capabilities?: any[];
};

export type VersionPolicyBootOutcome = {
  status: "OK" | "SOFT_BLOCK" | "HARD_BLOCK" | "MAINTENANCE";
  message: string;
  force_safe_mode: boolean;
};

/**
 * Boot adapter (contract):
 * - Publishes rt.__versionPolicy with a stable shape: { policy, outcome, decided_at, source }
 * - Publishes rt.__bootBanner on SOFT_BLOCK
 * - Publishes rt.__bootBlock on HARD_BLOCK
 * - Never requires billing / network / backend
 */
export function applyVersionPolicyBootGuards(
  rt: any,
  override?: VersionPolicyBootOverride,
): VersionPolicyBootOutcome {
  // Build a raw policy object (contract expects rt.__versionPolicy.policy)
  const rawPolicy = override
    ? {
        status: override.status || "OK",
        min_version: String(override.min_version || ""),
        latest_version: String(override.latest_version || ""),
        message: String(override.message || ""),
        safe_mode: Boolean(override.safe_mode),
        capabilities: Array.isArray(override.capabilities) ? override.capabilities : [],
      }
    : getVersionPolicyContract();

  // Compute outcome in the runtime's canonical vocabulary
  const outcome: VersionPolicyBootOutcome = {
    status: (rawPolicy.status || "OK") as any,
    message: String(rawPolicy.message || ""),
    force_safe_mode: Boolean(rawPolicy.safe_mode),
  };

  // Publish contract wrapper
  rt.__versionPolicy = {
    policy: rawPolicy,
    outcome,
    decided_at: Date.now(),
    source: override ? "override" : "contract",
  };

  // Boot UI signals (contract asserts .kind)
  if (outcome.status === "SOFT_BLOCK") {
    rt.__bootBanner = {
      kind: "SOFT_BLOCK",
      message: outcome.message || "Update recommended",
      policy: rawPolicy,
    };
  } else if (outcome.status === "MAINTENANCE") {
    rt.__bootBanner = {
      kind: "MAINTENANCE",
      message: outcome.message || "Maintenance",
      policy: rawPolicy,
    };
  } else {
    // Ensure stale banner is not retained between boots in tests
    if (rt.__bootBanner) delete rt.__bootBanner;
  }

  if (outcome.status === "HARD_BLOCK") {
    rt.__bootBlock = {
      kind: "HARD_BLOCK",
      message: outcome.message || "Update required",
      policy: rawPolicy,
    };
  } else {
    if (rt.__bootBlock) delete rt.__bootBlock;
  }

  // Preserve legacy publishing for other runtime observers
  rt.__versionPolicyOutcome = outcome;

  return outcome;
}

function getVersionPolicyContract(): any {
  // Adapter over existing runtime primitive
  const v: any = evaluateVersionPolicy();
  // If delegate returns an outcome/decision, normalize to policy-ish object
  if (v && typeof v === "object" && "status" in v) return v;
  return {
    status: "OK",
    min_version: "",
    latest_version: "",
    message: "",
    safe_mode: false,
    capabilities: [],
  };
}
