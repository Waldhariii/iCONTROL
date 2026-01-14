import type { StudioRuntime, StudioSafeMode } from "./studioRuntime";
import type { StudioAudit } from "./studioRuntime";
import { createAuditEmitter } from "./audit";

export interface MkStudioRuntimeArgs {
  audit?: StudioAudit | { emit: StudioAudit } | ((...args: any[]) => void);
  safeMode?: StudioSafeMode;
}

/**
 * Prod factory: returns a fully-typed StudioRuntime with safe defaults.
 * - audit.emit is always present and never throws
 * - safeMode is optional
 */
export function mkRuntime(args: MkStudioRuntimeArgs = {}): StudioRuntime {
  const auditCandidate = args.audit as any;
  const audit: StudioAudit =
    auditCandidate &&
    typeof auditCandidate.emit !== "function" &&
    typeof auditCandidate.emit?.emit === "function"
      ? { emit: auditCandidate.emit.emit.bind(auditCandidate.emit) }
      : typeof auditCandidate?.emit === "function"
        ? auditCandidate
        : typeof auditCandidate === "function"
          ? createAuditEmitter(auditCandidate)
          : createAuditEmitter();

  const enforcement = (args.safeMode as any)?.enforcement;
  const enforcementLevel = enforcement?.level;
  if (
    enforcementLevel &&
    enforcementLevel !== "SOFT" &&
    enforcementLevel !== "HARD"
  ) {
    throw new Error("ERR_RUNTIME_ENFORCEMENT_LEVEL_INVALID");
  }

  const safeMode =
    args.safeMode && enforcement
      ? {
          ...args.safeMode,
          enforcement: {
            ...enforcement,
            allow_bypass_capabilities: Array.isArray(
              enforcement.allow_bypass_capabilities,
            )
              ? enforcement.allow_bypass_capabilities
              : [],
          },
        }
      : args.safeMode;

  return {
    audit,
    __SAFE_MODE__: safeMode,
  };
}

export const mkStudioRuntime = mkRuntime;
