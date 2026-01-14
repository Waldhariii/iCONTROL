import type {
  AuditLevel,
  SafeModeEnforcementLevel,
} from "../../core/studio/runtime";
import type { AuditSink } from "../../core/studio/runtime";
import {
  createAuditEmitter,
  mkStudioRuntime as mkStudioRuntimeCore,
} from "../../core/studio/runtime";

export type AuditEmitFn = AuditSink;

export function mkTestStudioRuntime(args: {
  level: SafeModeEnforcementLevel;
  emit: AuditEmitFn;
  safeModeEnabled?: boolean;
}) {
  const audit = createAuditEmitter({ sink: args.emit });

  const safeMode =
    args.safeModeEnabled === false
      ? undefined
      : {
          enabled: true,
          enforcement: {
            level: args.level,
            scope: ["write"],
            blocked_actions: ["update"],
            allow_bypass_capabilities: [],
            message: "SAFE_MODE write policy",
          },
        };

  return mkStudioRuntimeCore({ audit, safeMode });
}

export function mkStudioRuntime(args: {
  level: SafeModeEnforcementLevel;
  emit: AuditEmitFn;
  safeModeEnabled?: boolean;
}) {
  return mkTestStudioRuntime(args);
}
