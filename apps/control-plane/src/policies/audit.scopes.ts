// Central registry of audit scopes (enterprise governance)
// Keep scopes stable; deprecate via aliasing rather than renaming.
// Add new scopes only with contract tests.

export const AUDIT_SCOPES = {
  FEATURE_FLAGS_GOVERNANCE: "feature_flags_governance",
  FORCED_FLAGS: "forced_flags",
  CONTROL_PLANE: "control_plane",
  SAFE_MODE: "safe_mode",
} as const;

export type AuditScope = (typeof AUDIT_SCOPES)[keyof typeof AUDIT_SCOPES];
