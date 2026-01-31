/**
 * AUTO-SHIM (P1): legacy pages re-export.
 * Purpose: keep PROD stable while migrating callers to surfaces.
 * DO NOT add tenant-specific data here.
 */
export * from "../../../../platform/routing/guards/devOnlyRouteGuard";
import def from "../../../../platform/routing/guards/devOnlyRouteGuard";
export default def;
