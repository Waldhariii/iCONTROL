// @ts-nocheck
import { MAIN_SYSTEM_THEME } from "./mainSystem.data";

export const ICONTROL_THEME_CSSVARS_V1 = true as const;

type Tokens = typeof MAIN_SYSTEM_THEME.tokens;

const VARS: Array<[keyof Tokens, string]> = [
  ["card", "--ic-card"],
  ["border", "--ic-border"],
  ["text", "--ic-text"],
  ["mutedText", "--ic-mutedText"],
  ["panel", "--ic-panel"],
  ["accent", "--ic-accent"],
  ["accent2", "--ic-accent2"]
];

export function applyThemeTokensToCSSVars(doc: Document = document): void {
  const root = doc.documentElement;
  const tok = MAIN_SYSTEM_THEME.tokens as Record<string, unknown>;

  for (const [k, cssVar] of VARS) {
    const v = tok?.[k as string];
    if (typeof v === "string" && v.trim()) {
      root.style.setProperty(cssVar, v);
    }
  }
}

export function cssVar(name: string, fallback?: string): string {
  return fallback ? `var(${name}, ${fallback})` : `var(${name})`;
}
