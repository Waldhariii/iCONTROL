import { buildVersionPolicyBootOutcome } from "./version_policy.boot";
import { forcedOffFlagsFromCapabilities } from "./feature_flags.capabilities";
import { forceOffMany } from "./feature_flags.merge";
import { buildFeatureFlagsBootOutcome } from "./feature_flags.boot";
import { ERROR_CODES } from "../core/errors/error_codes";

type AnyWin = any;

export function applyControlPlaneBootGuards(w: AnyWin): void {
  if (!w) return;
  if (w.__CONTROL_PLANE_APPLIED__) return;
  w.__CONTROL_PLANE_APPLIED__ = true;

  // Version Policy (already safe)
  const vp = buildVersionPolicyBootOutcome();
  w.__versionPolicy = vp.policy;
  w.__versionDecisions = vp.decisions;

  // Capabilities → forced OFF flags
  const forced = forcedOffFlagsFromCapabilities(vp.policy?.capabilities);

  // Feature flags outcome + hard overrides
  const ff0 = buildFeatureFlagsBootOutcome(undefined, { tenant: String(w?.__tenant || "default") });
  const merged = forceOffMany(ff0.flags, forced);
  const ff = buildFeatureFlagsBootOutcome(merged, { tenant: String(w?.__tenant || "default") });

  w.__FEATURE_FLAGS__ = ff.flags;
  w.__FEATURE_DECISIONS__ = ff.decisions;

  // Observability: audit once (no spam)
  try {
    const emit = w?.audit?.emit || w?.audit?.log || w?.auditLog?.append || w?.core?.audit?.emit;
    if (typeof emit === "function") {
      if (forced.length && !w.__CP_FORCED_AUDITED__) {
        w.__CP_FORCED_AUDITED__ = true;
        emit.call(
          w,
          "WARN",
          (ERROR_CODES.WARN_FLAGS_FORCED_OFF ?? "WARN_FLAGS_FORCED_OFF"),
          `Control Plane forced OFF ${forced.length} feature flag(s) via capabilities`,
          { source: "control_plane", forced }
        );
      }
    }
  } catch {}
}
