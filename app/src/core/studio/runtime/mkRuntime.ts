import type { StudioRuntime, StudioSafeMode } from "./studioRuntime";
import type { StudioAudit } from "./studioRuntime";
import { createAuditEmitter } from "./audit";

export interface MkStudioRuntimeArgs {
  audit?: StudioAudit;
  safeMode?: StudioSafeMode;
}

/**
 * Prod factory: returns a fully-typed StudioRuntime with safe defaults.
 * - audit.emit is always present and never throws
 * - safeMode is optional
 */
export function mkStudioRuntime(args: MkStudioRuntimeArgs = {}): StudioRuntime {
  return {
    audit: args.audit ?? createAuditEmitter(),
    __SAFE_MODE__: args.safeMode,
  };
}
