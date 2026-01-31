/**
 * AUTO-SHIM (P1): legacy pages re-export.
 * Purpose: keep PROD stable while migrating callers to surfaces.
 * DO NOT add tenant-specific data here.
 */
export * from "../../../../pages/cp/_shared/devOnlyRouteGuard";
import def from "../../../../pages/cp/_shared/devOnlyRouteGuard";
export default def;
