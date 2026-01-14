export type AuditLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface StudioAudit {
  emit(
    level: AuditLevel,
    code: string,
    meta?: Readonly<Record<string, unknown>>,
  ): void;
}

export type SafeModeEnforcementLevel = "SOFT" | "HARD";

export interface SafeModeEnforcementPolicy {
  level: SafeModeEnforcementLevel;
  scope: string[];
  blocked_actions: string[];
  allow_bypass_capabilities: string[];
  message?: string;
}

export interface StudioSafeMode {
  enabled: boolean;
  enforcement?: SafeModeEnforcementPolicy;
}

export interface StudioRuntime {
  audit: StudioAudit;
  __SAFE_MODE__?: StudioSafeMode;
}
