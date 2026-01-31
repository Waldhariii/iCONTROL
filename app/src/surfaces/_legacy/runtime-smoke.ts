/**
 * AUTO-SHIM (P1): legacy pages re-export.
 * Purpose: keep PROD stable while migrating callers to surfaces.
 */
export * from "../surfaces/shared/runtime-smoke/Page";
import def from "../surfaces/shared/runtime-smoke/Page";
export default def;
