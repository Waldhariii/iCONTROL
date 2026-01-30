/* ICONTROL_DIAG_DEVONLY_ROUTES_V1 */
/**
 * Deprecated (SSOT moved to ./diagnosticInstall.ts)
 * Rationale:
 * - This file previously contained malformed Object.defineProperty blocks
 *   that break Vite/esbuild transform.
 * - Keep as thin re-export layer to preserve import paths without side-effects.
 */
export { installIControlDiagnosticDEVOnly } from "./diagnosticInstall";
export type { DiagnosticApi, DiagnosticSnapshot } from "./diagnosticInstall";
