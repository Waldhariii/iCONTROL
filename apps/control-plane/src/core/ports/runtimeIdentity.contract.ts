/**
 * Runtime Identity — Contract v1 (SSOT)
 * - Single source of truth for tenant + actor identity at runtime.
 * - No globals. No implicit fallback in prod path.
 */
export type TenantId = string;
export type ActorId = string;

export type RuntimeIdentity = Readonly<{
  tenantId: TenantId;
  actorId: ActorId;
  // provenance is helpful for audit/debug (session, token, default, etc.)
  source: "session" | "token" | "dev-default" | "safe-mode-default";
}>;

export interface RuntimeIdentityPort {
  /** Must return a deterministic identity or throw (in strict mode). */
  get(): RuntimeIdentity;

  /** Returns null when identity is unavailable (non-strict usage). */
  tryGet(): RuntimeIdentity | null;
}
