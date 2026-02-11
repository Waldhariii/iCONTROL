import { buildVersionPolicyBootOutcome, type VersionPolicyBootOutcome } from "./version_policy.boot";

type AnyRuntime = Record<string, any>;

/**
 * Apply version policy at boot in a defensive way:
 * - No navigation
 * - No storage writes
 * - Publishes outcome on runtime for later UI/render decisions
 * - Tries to emit audit events if an audit sink exists
 * - Tries to force SAFE_MODE if a safe-mode setter exists
 */
export function applyVersionPolicyBootGuards(runtime: AnyRuntime, override?: unknown): VersionPolicyBootOutcome {
  const outcome = buildVersionPolicyBootOutcome(override);
  const isDev = (() => {
    try {
      if ((import.meta as any)?.env?.DEV === true) return true;
    } catch {}
    try {
      if (typeof window !== "undefined") {
        const host = window.location.hostname;
        if (host === "localhost" || host === "127.0.0.1") return true;
      }
    } catch {}
    return false;
  })();

  // Publish outcome for UI plane / diagnostics
  runtime["__versionPolicy"] = outcome;

  // 1) Emit loader audit events (if available)
  // Try a few common shapes without coupling
  const emitAudit =
    runtime?.["audit"]?.emit ??
    runtime?.["audit"]?.log ??
    runtime?.["auditLog"]?.append ??
    runtime?.["auditLog"]?.push ??
    runtime?.["core"]?.audit?.emit ??
    null;

  if (typeof emitAudit === "function") {
    for (const ev of outcome.audit) {
      // normalize signature: (level, code, message, meta?)
      try {
        emitAudit.call(runtime, ev.level, ev.code, ev.message, { source: "version_policy", policySource: outcome.source });
      } catch {
        // never crash boot because of audit
      }
    }
  }

  // 2) Force SAFE_MODE if decision exists and runtime supports it
  const forceSafe = outcome.decisions.some((d) => d.kind === "FORCE_SAFE_MODE");
  if (forceSafe) {
    const setSafeMode =
      runtime?.["safeMode"]?.enable ??
      runtime?.["SAFE_MODE"]?.enable ??
      runtime?.["runtime"]?.safeMode?.enable ??
      runtime?.["setSafeMode"] ??
      runtime?.["core"]?.setSafeMode ??
      null;

    if (typeof setSafeMode === "function") {
      try {
        setSafeMode.call(runtime, true);
      } catch {
        // never crash boot because of safe-mode setter mismatch
      }
    }
  }

  // 3) Publish a normalized banner hint for SOFT_BLOCK (no UI rendering here)
  const soft = outcome.decisions.find((d) => d.kind === "SOFT_BLOCK");
  if (soft) {
    runtime["__bootBanner"] = {
      kind: "SOFT_BLOCK",
      code: (soft as any).warnCode,
      message: (soft as any).message,
    };
  }

  // 4) Publish hard/maintenance block hints (no navigation here)
  const hard = outcome.decisions.find((d) => d.kind === "HARD_BLOCK");
  const maint = outcome.decisions.find((d) => d.kind === "MAINTENANCE");
  // DEV safety: never hard-block local dev builds.
  if (!isDev && (hard || maint)) {
    runtime["__bootBlock"] = hard
      ? { kind: "HARD_BLOCK", code: (hard as any).errCode, message: (hard as any).message }
      : { kind: "MAINTENANCE", code: (maint as any).errCode, message: (maint as any).message };
  }

  return outcome;
}
