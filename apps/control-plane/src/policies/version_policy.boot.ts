import { loadVersionPolicy, type VersionPolicyLoadResult } from "./version_policy.loader";
import { evaluateVersionPolicy, type BootGuardDecision } from "./version_policy.enforce";

export type VersionPolicyBootOutcome = {
  policy: VersionPolicyLoadResult["policy"];
  source: VersionPolicyLoadResult["source"];
  decisions: BootGuardDecision[];
  // Flattened audit events (loader + evaluation)
  audit: VersionPolicyLoadResult["audit"];
};

/**
 * Build the boot-time outcome for Version Policy.
 * Pure function: no navigation, no storage writes.
 * Runtime is responsible for applying SAFE_MODE and for rendering/blocking.
 */
export function buildVersionPolicyBootOutcome(override?: unknown): VersionPolicyBootOutcome {
  const loaded = loadVersionPolicy(override);
  const decisions = evaluateVersionPolicy(loaded.policy);

  return {
    policy: loaded.policy,
    source: loaded.source,
    decisions,
    audit: loaded.audit,
  };
}
