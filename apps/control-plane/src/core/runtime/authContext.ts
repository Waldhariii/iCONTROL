/**
 * Normalized auth context from window.__ICONTROL_RUNTIME__.
 * Use this instead of reading the union type directly.
 */
export type AuthContext = {
  tenantId: string;
  actorId: string;
  role: string;
};

export type RawRuntime = false | { tenantId?: string; actorId?: string; role?: string };

const DEFAULTS: AuthContext = {
  tenantId: "default",
  actorId: "master",
  role: "SYSADMIN",
};

/**
 * Normalizes raw runtime (false | partial object) into a strict AuthContext.
 * Bans direct access on the union; use this in cpApi and authService.
 */
export function normalizeAuthContext(
  raw: RawRuntime | undefined | null
): AuthContext {
  const o = raw && typeof raw === "object" ? raw : {};
  return {
    tenantId: o.tenantId ?? DEFAULTS.tenantId,
    actorId: o.actorId ?? DEFAULTS.actorId,
    role: o.role ?? DEFAULTS.role,
  };
}
