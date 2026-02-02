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
  | "cp.entitlements"
  | "cp._shared"
  | "cp.account"
  | "cp.dashboard"
  | "cp.home-cp"
  | "cp.login"
  | "cp.login-theme"
  | "cp.notfound"
  | "cp.pages"
  | "cp.registry"
;

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

  "cp._shared": Object.freeze({ key: "cp._shared" }),
  "cp.account": Object.freeze({ key: "cp.account" }),
  "cp.dashboard": Object.freeze({ key: "cp.dashboard" }),
  "cp.home-cp": Object.freeze({ key: "cp.home-cp" }),
  "cp.login": Object.freeze({ key: "cp.login" }),
  "cp.login-theme": Object.freeze({ key: "cp.login-theme" }),
  "cp.notfound": Object.freeze({ key: "cp.notfound" }),
  "cp.pages": Object.freeze({ key: "cp.pages" }),
  "cp.registry": Object.freeze({ key: "cp.registry" }),

});

/** Export list for contract tests (stable ordering) */
export const CP_SURFACE_KEYS: readonly CpSurfaceKey[] = Object.freeze([
  
  "cp._shared",
  "cp.account",
  "cp.dashboard",
  "cp.entitlements",
  "cp.home-cp",
  "cp.login",
  "cp.login-theme",
  "cp.notfound",
  "cp.pages",
  "cp.registry",
  "cp.settings",
  "cp.users"

]);
