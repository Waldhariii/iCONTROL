import type { SemanticTokens, ThemeOverrides } from "./types";

export function applyOverrides(base: SemanticTokens, ov?: ThemeOverrides): SemanticTokens {
  if (!ov) return base;
  return { ...base, ...ov };
}
