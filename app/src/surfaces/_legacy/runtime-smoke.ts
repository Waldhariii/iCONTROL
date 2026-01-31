/**
 * AUTO-SHIM (P1): legacy pages re-export.
 * Purpose: keep PROD stable while migrating callers to surfaces.
 */
export * from "../pages/runtime-smoke";
import def from "../pages/runtime-smoke";
export default def;
