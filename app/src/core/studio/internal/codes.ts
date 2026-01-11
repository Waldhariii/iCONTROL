// iCONTROL Error/Warning codes (stable contract). Do not rename without migration.
//
// ERR_* : hard failures
// WARN_*: non-fatal signals
export const CODES = {
  // Rendering / safety
  ERR_RENDER_BLOCKED: "ERR_RENDER_BLOCKED",
  ERR_INVALID_INPUT: "ERR_INVALID_INPUT",
  ERR_INTERNAL: "ERR_INTERNAL",

  // Runtime compilation/execution
  ERR_INVALID_BLOCK: "ERR_INVALID_BLOCK",
  ERR_FORBIDDEN: "ERR_FORBIDDEN",
  WARN_REGISTRY_MISS: "WARN_REGISTRY_MISS",
  WARN_REGISTRY_THROW: "WARN_REGISTRY_THROW",
} as const;

export type Code = (typeof CODES)[keyof typeof CODES];
