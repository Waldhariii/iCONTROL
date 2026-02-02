/**
 * Move15: CP Surface Registry (SSOT)
 * Goal: single source of truth for CP surfaces:
 * - surfaceKey -> required capability (optional)
 * - redirect target on deny (optional; default handled by guard)
 *
 * This registry is the only allowed place to declare CP surface access requirements.
 */
export type CpSurfaceKey =
  | "cp.users"
  | "cp.settings"
  | "cp.entitlements";

export type CpSurfaceSpec = Readonly<{
  key: CpSurfaceKey;
  requiredCapability?: string; // e.g. "canAdminEntitlements"
  denyRedirectTo?: string;     // default: "/cp/#/blocked"
}>;

export const CP_SURFACE_REGISTRY: Readonly<Record<CpSurfaceKey, CpSurfaceSpec>> = Object.freeze({
  "cp.users": Object.freeze({ key: "cp.users" }),

  // settings is generally available once CP is accessible; keep capability optional
  "cp.settings": Object.freeze({ key: "cp.settings" }),

  // entitlements is privileged; tie it to capability used by policy-capabilities contract
  "cp.entitlements": Object.freeze({
    key: "cp.entitlements",
    requiredCapability: "canAdminEntitlements",
  }),
});

/** Export list for contract tests (stable ordering) */
export const CP_SURFACE_KEYS: readonly CpSurfaceKey[] = Object.freeze([
  "cp.users",
  "cp.settings",
  "cp.entitlements",
]);
