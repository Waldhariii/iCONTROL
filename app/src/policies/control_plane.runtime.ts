import { buildVersionPolicyBootOutcome } from "./version_policy.boot";
import { auditGovernedFeatureFlags } from "./feature_flags.governance";
import { forcedOffFlagsFromCapabilities } from "./feature_flags.capabilities";
import { forceOffMany } from "./feature_flags.merge";
import { buildFeatureFlagsBootOutcome } from "./feature_flags.boot";
import { ERROR_CODES } from "../core/errors/error_codes";
import { AUDIT_SCOPES } from "./audit.scopes";
import { emitAudit } from "./audit.emit";

type AnyWin = any;

export function applyControlPlaneBootGuards(w: AnyWin): void {
  if (!w) return;
  if (w.__CONTROL_PLANE_APPLIED__) return;

  // Observability contract: audit payload schema version (migration-proof)
  w.__CONTROL_PLANE_AUDIT_SCHEMA_VERSION__ = 1;


  


  // Governance: feature flags metadata audit (owner/expiry) — audit-only (idempotent)
  try {
    const rt = w as any;
    if (!rt.__FF_GOV_AUDITED__) {
      rt.__FF_GOV_AUDITED__ = true;

      const ffSet =
        rt.__featureFlags || rt.__FEATURE_FLAGS__ || rt.__ff || rt.featureFlags || rt.flags || {};

      const ts = new Date().toISOString();
    const govAudit = auditGovernedFeatureFlags(ffSet) || [];
    const govAudit2 = govAudit.map((e: any) => ({
      ...e,
      ts,
      module: "control_plane",
      scope: AUDIT_SCOPES.FEATURE_FLAGS_GOVERNANCE,
      source: "feature_flags_governance",
    }));
    rt.__ffGovernanceAudit = govAudit2;
const emit =
        rt?.audit?.emit ||
        rt?.audit?.log ||
        rt?.auditLog?.append ||
        rt?.core?.audit?.emit;

      if (typeof emit === "function") {
        for (const e of govAudit) {
          emitAudit(
          rt,
          e.level,
          e.code,
          e.message,
          {
            scope: AUDIT_SCOPES.FEATURE_FLAGS_GOVERNANCE,
            source: "feature_flags_governance",
            data: { ...(e.data || {}) },
          },
          "__FF_GOV_AUDIT_FAILED__"
        );
        }
      }
    }
  } catch { try { (w as any).__FF_GOV_AUDIT_FAILED__ = true; } catch {} }
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
  // Canonical alias (single source of truth for consumers)
  w.__featureFlags = { flags: w.__FEATURE_FLAGS__, decisions: w.__FEATURE_DECISIONS__ };


  // Observability: audit once (no spam)
  try {
    const rt = w as any;
    const emit = rt?.audit?.emit || rt?.audit?.log || rt?.auditLog?.append || rt?.core?.audit?.emit;
    if (typeof emit === "function") {
      if (forced.length && !rt.__CP_FORCED_AUDITED__) {
        rt.__CP_FORCED_AUDITED__ = true;
        emitAudit(
          w,
          "WARN",
          (ERROR_CODES.WARN_FLAGS_FORCED_OFF ?? "WARN_FLAGS_FORCED_OFF"),
          `Control Plane forced OFF ${forced.length} feature flag(s) via capabilities`,
          {
            scope: AUDIT_SCOPES.FORCED_FLAGS,
            source: "control_plane",
            data: { forced },
          },
          "__CP_FORCED_AUDIT_FAILED__"
        );
}
    }
  } catch { try { (w as any).__CP_FORCED_AUDIT_FAILED__ = true; } catch {} }
}
