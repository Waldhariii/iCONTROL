import type { ThemeTokens } from "./themeTokens";

/**
 * Applique un ThemeTokens en CSS variables (SSOT).
 * IMPORTANT: aucun composant ne doit hardcoder des couleurs.
 */
export function applyThemeTokensToCssVars(doc: Document, t: ThemeTokens): void {
  const root = doc.documentElement;

  // Global
  root.style.setProperty("--app-bg-primary", t.appBgPrimary);
  root.style.setProperty("--app-bg-secondary", t.appBgSecondary);
  root.style.setProperty("--app-bg-gradient", t.appBgGradient);

  root.style.setProperty("--surface-0", t.surface0);
  root.style.setProperty("--surface-1", t.surface1);
  root.style.setProperty("--surface-border", t.surfaceBorder);

  root.style.setProperty("--text-primary", t.textPrimary);
  root.style.setProperty("--text-muted", t.textMuted);

  root.style.setProperty("--accent-primary", t.accentPrimary);
  root.style.setProperty("--accent-glow", t.accentGlow);

  root.style.setProperty("--shadow-md", t.shadowMd);
  root.style.setProperty("--shadow-lg", t.shadowLg);

  // CP Login scoped (optional)
  if (t.cpLogin) {
    if (t.cpLogin.pageBg) root.style.setProperty("--cp-login-page-bg", t.cpLogin.pageBg);
    if (t.cpLogin.panelBg) root.style.setProperty("--cp-login-panel-bg", t.cpLogin.panelBg);
    if (t.cpLogin.cardBg) root.style.setProperty("--cp-login-card-bg", t.cpLogin.cardBg);
    if (t.cpLogin.inputBg) root.style.setProperty("--cp-login-input-bg", t.cpLogin.inputBg);
    if (t.cpLogin.buttonBg) root.style.setProperty("--cp-login-button-bg", t.cpLogin.buttonBg);
  }

  // Meta (debug / ops)
  root.dataset["themeId"] = t.meta.id;
  root.dataset["themeVersion"] = t.meta.version;
  root.dataset["themeMode"] = t.meta.mode;
  if (t.meta.scope) root.dataset["themeScope"] = t.meta.scope;
  if (t.meta.brand) root.dataset["themeBrand"] = t.meta.brand;
}
