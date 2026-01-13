export const ERROR_CODES = {
  // Version policy enforcement
  ERR_VERSION_HARD_BLOCK: "ERR_VERSION_HARD_BLOCK",
  ERR_MAINTENANCE_MODE: "ERR_MAINTENANCE_MODE",

  // Non-blocking policy outcomes
  WARN_VERSION_SOFT_BLOCK: "WARN_VERSION_SOFT_BLOCK",

  // Policy loading/validation issues
  WARN_POLICY_INVALID: "WARN_POLICY_INVALID",
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
