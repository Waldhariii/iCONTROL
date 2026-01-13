import type { VersionPolicy } from "./version_policy.schema";
import { ERROR_CODES } from "../core/errors/error_codes";

export type BootGuardDecision =
  | { kind: "OK" }
  | { kind: "SOFT_BLOCK"; warnCode: string; message: string }
  | { kind: "HARD_BLOCK"; errCode: string; message: string }
  | { kind: "MAINTENANCE"; errCode: string; message: string }
  | { kind: "FORCE_SAFE_MODE"; warnCode: string; message: string };

export function evaluateVersionPolicy(policy: VersionPolicy): BootGuardDecision[] {
  const decisions: BootGuardDecision[] = [];

  // 1) If policy forces SAFE_MODE, emit a decision (does not apply it here)
  if (policy.safe_mode) {
    decisions.push({
      kind: "FORCE_SAFE_MODE",
      warnCode: "WARN_POLICY_FORCE_SAFE_MODE",
      message: policy.message || "SAFE_MODE forced by version policy.",
    });
  }

  // 2) Status-based enforcement decisions
  switch (policy.status) {
    case "OK":
      return decisions.length ? decisions : [{ kind: "OK" }];

    case "SOFT_BLOCK":
      decisions.push({
        kind: "SOFT_BLOCK",
        warnCode: ERROR_CODES.WARN_VERSION_SOFT_BLOCK,
        message: policy.message || "A newer version is available.",
      });
      return decisions;

    case "HARD_BLOCK":
      decisions.push({
        kind: "HARD_BLOCK",
        errCode: ERROR_CODES.ERR_VERSION_HARD_BLOCK,
        message: policy.message || "This version is blocked. Please update.",
      });
      return decisions;

    case "MAINTENANCE":
      decisions.push({
        kind: "MAINTENANCE",
        errCode: ERROR_CODES.ERR_MAINTENANCE_MODE,
        message: policy.message || "Service is under maintenance.",
      });
      return decisions;

    default: {
      // Exhaustiveness guard - if new status added later, fail safe via SOFT_BLOCK
      decisions.push({
        kind: "SOFT_BLOCK",
        warnCode: ERROR_CODES.WARN_VERSION_SOFT_BLOCK,
        message: "Unknown version policy status. Proceeding with caution.",
      });
      return decisions;
    }
  }
}
