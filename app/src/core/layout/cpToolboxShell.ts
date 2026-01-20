/**
 * // @placeholder owner:tbd expiry:2099-12-31 risk:low tag:WARN_PLACEHOLDER_NOT_IMPLEMENTED
 * PLACEHOLDER GOVERNANCE
 * @placeholder
 * code: WARN_PLACEHOLDER_NOT_IMPLEMENTED
 * owner: core-platform
 * expiry: TBD
 * risk: LOW
 * file: app/src/core/layout/cpToolboxShell.ts
 *
 * Rationale:
 * - Module requis par app/src/main.ts (rollup resolve).
 * - Implémentation minimale/stable pour unblock bundling.
 * - À remplacer par le vrai layout shell (CP toolbox) avant prod.
 */

export type CpToolboxShellMount = {
  root: HTMLElement;
};

export function mountCpToolboxShell(opts: CpToolboxShellMount): void {
  // No-op minimal: keep deterministic, no side-effects.
  if (!opts || !opts.root) return;
}

export const createCPToolboxShell = undefined as any;
