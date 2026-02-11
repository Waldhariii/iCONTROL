/**
 * THEME SSOT — Enterprise-grade
 * Principe: pages/comp doivent consommer UNIQUEMENT des CSS vars.
 * Les valeurs viennent d’un resolver (brand/experience/tenant/preview), puis apply().
 */

export type ThemeMode = "dark" | "light";

/**
 * Tokens globaux (base brand/system)
 * - App background
 * - Surfaces (cards/panels)
 * - Text & accent
 * - Shadows
 *
 * IMPORTANT: garder ces noms stables pour éviter les regressions.
 */
export type ThemeTokens = {
  meta: {
    id: string;              // ex: "cp-dashboard-charcoal"
    version: string;         // ex: "v2026.01.21.3"
    mode: ThemeMode;         // dark/light
    scope?: string;          // ex: "cp.dashboard" | "cp.login"
    brand?: string;          // ex: "icontrol"
  };

  // Backgrounds
  appBgPrimary: string;      // --app-bg-primary
  appBgSecondary: string;    // --app-bg-secondary
  appBgGradient: string;     // --app-bg-gradient

  // Surfaces
  surface0: string;          // --surface-0
  surface1: string;          // --surface-1
  surfaceBorder: string;     // --surface-border

  // Text
  textPrimary: string;       // --text-primary
  textMuted: string;         // --text-muted

  // Accent
  accentPrimary: string;     // --accent-primary
  accentGlow: string;        // --accent-glow

  // Shadows
  shadowMd: string;          // --shadow-md
  shadowLg: string;          // --shadow-lg

  /**
   * Zone CP Login (scopée) — optionnel mais recommandé
   * Objectif: login peut "hériter" du dashboard via mapping.
   */
  cpLogin?: {
    pageBg?: string;         // --cp-login-page-bg
    panelBg?: string;        // --cp-login-panel-bg
    cardBg?: string;         // --cp-login-card-bg
    inputBg?: string;        // --cp-login-input-bg
    buttonBg?: string;       // --cp-login-button-bg
  };
};
