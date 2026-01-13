import { buildFeatureFlagsBootOutcome } from "./feature_flags.boot";

type AnyWin = any;

function tryGetTenant(w: AnyWin): string {
  // Best-effort tenant source; stays offline and read-only.
  // If your tenant namespace provider exposes something else later, we can adapt without refactor.
  return String(w?.__tenant || w?.tenant || w?.TENANT || "default");
}

export function applyFeatureFlagsBootGuards(w: AnyWin, override?: unknown): void {
  if (!w) return;

  if (w.__FF_GUARDS_APPLIED__) return;
  w.__FF_GUARDS_APPLIED__ = true;

  const tenant = tryGetTenant(w);
  const out = buildFeatureFlagsBootOutcome(override, { tenant });

  // Expose read-only-ish (convention). No freezing to avoid edge runtime issues.
  w.__FEATURE_FLAGS__ = out.flags;
  w.__FEATURE_DECISIONS__ = out.decisions;

  // Audit: idempotent emission
  try {
    if (!w.__FF_AUDITED__) w.__FF_AUDITED__ = { invalid: false };
    const emit = w?.audit?.emit || w?.audit?.log || w?.auditLog?.append || w?.core?.audit?.emit;
    if (typeof emit === "function") {
      // loader WARNs
      if (out.audit?.length) {
        for (const e of out.audit) {
          // only WARN expected here
          emit.call(w, e.level, e.code, e.message, { source: "feature_flags" });
        }
      }
    }
  } catch {}
}
