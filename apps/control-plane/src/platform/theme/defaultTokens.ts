import type { ThemeSpec } from "./types";

/**
 * Default tokens reference CSS variables (works in light/dark without hardcoding colors here).
 * Later: map to your design tokens system (ICONTROL_DESIGN_TOKENS_V1).
 */
export const DEFAULT_THEME_LIGHT: ThemeSpec = {
  mode: "light",
  tokens: {
    bg: "var(--ic-bg)",
    bgMuted: "var(--ic-bg-muted)",
    panel: "var(--ic-panel)",
    panelMuted: "var(--ic-panel-muted)",

    text: "var(--ic-text)",
    textMuted: "var(--ic-text-muted)",

    border: "var(--ic-border)",
    focusRing: "var(--ic-focus-ring)",

    accent: "var(--ic-accent)",
    accentMuted: "var(--ic-accent-muted)",

    success: "var(--ic-success)",
    warning: "var(--ic-warning)",
    danger: "var(--ic-danger)",
  },
};

export const DEFAULT_THEME_DARK: ThemeSpec = {
  mode: "dark",
  tokens: {
    bg: "var(--ic-bg)",
    bgMuted: "var(--ic-bg-muted)",
    panel: "var(--ic-panel)",
    panelMuted: "var(--ic-panel-muted)",

    text: "var(--ic-text)",
    textMuted: "var(--ic-text-muted)",

    border: "var(--ic-border)",
    focusRing: "var(--ic-focus-ring)",

    accent: "var(--ic-accent)",
    accentMuted: "var(--ic-accent-muted)",

    success: "var(--ic-success)",
    warning: "var(--ic-warning)",
    danger: "var(--ic-danger)",
  },
};
