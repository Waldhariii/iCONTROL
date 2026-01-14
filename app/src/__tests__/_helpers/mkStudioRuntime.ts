import type {
  StudioRuntime,
  SafeModeEnforcementLevel,
} from "../../core/studio/runtime/studioRuntime";

export type AuditEmitFn = StudioRuntime["audit"]["emit"];

export function mkStudioRuntime(opts: {
  level: SafeModeEnforcementLevel;
  emit: AuditEmitFn;
  enabled?: boolean;
  scope?: string[];
  blocked_actions?: string[];
  allow_bypass_capabilities?: string[];
  message?: string;
}): StudioRuntime {
  const {
    level,
    emit,
    enabled = true,
    scope = ["write"],
    blocked_actions = ["update"],
    allow_bypass_capabilities = [],
    message = "SAFE_MODE write policy",
  } = opts;

  return {
    audit: { emit },
    __SAFE_MODE__: {
      enabled,
      enforcement: {
        level,
        scope,
        blocked_actions,
        allow_bypass_capabilities,
        message,
      },
    },
  };
}
