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

  return {
    audit,
    __SAFE_MODE__: args.safeMode,
  };
}

export const mkStudioRuntime = mkRuntime;
