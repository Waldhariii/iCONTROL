export type AppKind = "APP" | "CP";

export type ThemeMode = "light" | "dark";

/**
 * Semantic tokens (NOT raw colors). Values are CSS variables (preferred).
 * This keeps UI stable and enables theme switching without refactors.
 */
export type SemanticTokens = {
  // surfaces
  bg: string;
  bgMuted: string;
  panel: string;
  panelMuted: string;

  // text
  text: string;
  textMuted: string;

  // borders / focus
  border: string;
  focusRing: string;

  // brand / accent
  accent: string;
  accentMuted: string;

  // status
  success: string;
  warning: string;
  danger: string;
};

export type ThemeSpec = {
  mode: ThemeMode;
  tokens: SemanticTokens;
};

export type ThemeOverrides = Partial<SemanticTokens>;

export type ResolvedTheme = {
  tenantId: string;
  appKind: AppKind;
  mode: ThemeMode;
  tokens: SemanticTokens;
  meta: {
    source: "default" | "tenantOverride";
    appliedOverrides: boolean;
  };
};
