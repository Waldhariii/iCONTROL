import type { AppKind, ResolvedTheme, ThemeMode, ThemeOverrides } from "./types";
import { DEFAULT_THEME_DARK, DEFAULT_THEME_LIGHT } from "./defaultTokens";
import { applyOverrides } from "./merge";

/**
 * Future: load tenant overrides from VFS via WriteGateway (admin-controlled).
 * For now: allow injection through a global snapshot (browser-safe), or return defaults.
 */
declare global {
  // eslint-disable-next-line no-var
  var __ICONTROL_THEME_OVERRIDES__: Record<string, Partial<Record<AppKind, ThemeOverrides>>> | undefined;
}

function getDefault(mode: ThemeMode) {
  return mode === "dark" ? DEFAULT_THEME_DARK : DEFAULT_THEME_LIGHT;
}

/**
 * Strategy:
 * - CP can set global theme overrides per-tenant (later persisted).
 * - APP follows CP global theme if present (admin controlled).
 */
export function resolveTheme(input: {
  tenantId: string;
  appKind: AppKind;
  mode: ThemeMode;
}): ResolvedTheme {
  const spec = getDefault(input.mode);
  const all = (globalThis as any).__ICONTROL_THEME_OVERRIDES__ as any | undefined;

  const tenant = all?.[input.tenantId];
  const ov = (tenant?.[input.appKind] || tenant?.["CP"] || tenant?.["APP"]) as ThemeOverrides | undefined;

  const tokens = applyOverrides(spec.tokens, ov);
  const applied = !!ov && Object.keys(ov).length > 0;

  return {
    tenantId: input.tenantId,
    appKind: input.appKind,
    mode: input.mode,
    tokens,
    meta: {
      source: applied ? "tenantOverride" : "default",
      appliedOverrides: applied,
    },
  };
}
