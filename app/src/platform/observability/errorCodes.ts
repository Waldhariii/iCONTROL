/**
 * Error code taxonomy (stable identifiers).
 * Keep codes semantic and forward-compatible.
 */
export const ERR = {
  POLICY_DENY: "ERR_POLICY_DENY",
  POLICY_ADMIN_ENTITLEMENTS_DENIED: "ERR_POLICY_ADMIN_ENTITLEMENTS_DENIED",
  POLICY_ADMIN_THEME_DENIED: "ERR_POLICY_ADMIN_THEME_DENIED",

  RUNTIME_CONFIG_INVALID: "ERR_RUNTIME_CONFIG_INVALID",
  RUNTIME_CONFIG_READ: "ERR_RUNTIME_CONFIG_READ",
  RUNTIME_CONFIG_SCHEMA_VERSION: "ERR_RUNTIME_CONFIG_SCHEMA_VERSION",

  WRITE_GATEWAY_DENY: "ERR_WRITE_GATEWAY_DENY",
} as const;

export const WARN = {
  FALLBACK_DEFAULT_CONFIG: "WARN_FALLBACK_DEFAULT_CONFIG",
  SELF_HEAL_TEST: "WARN_SELF_HEAL_TEST",
} as const;

export type ErrCode = (typeof ERR)[keyof typeof ERR];
export type WarnCode = (typeof WARN)[keyof typeof WARN];
export type AnyCode = ErrCode | WarnCode | "OK";
