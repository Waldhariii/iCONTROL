import type { CpLoginTheme } from "./loginTheme";

export type UiTarget = "text" | "background" | "button" | "input" | "link" | "border" | "icon" | "shadow" | "accent" | "chart";
export type UiRole = "primary" | "secondary" | "muted" | "danger" | "warning" | "success" | "info";
export type UiState = "default" | "hover" | "active" | "focus" | "disabled" | "selected";

export type LoginThemeTokenMeta = {
  uiTarget: UiTarget;
  role: UiRole;
  state: UiState;
  label: string;
  supportsMetallic?: boolean;
};

export const LOGIN_THEME_TOKEN_MAP: Partial<Record<keyof CpLoginTheme, LoginThemeTokenMeta>> = {
  bgGradient0: { uiTarget: "background", role: "primary", state: "default", label: "Page gradient A" },
  bgGradient1: { uiTarget: "background", role: "secondary", state: "default", label: "Page gradient B" },
  bgGradient2: { uiTarget: "background", role: "muted", state: "default", label: "Base background" },
  noise: { uiTarget: "background", role: "muted", state: "default", label: "Background noise" },
  noiseOpacity: { uiTarget: "background", role: "muted", state: "default", label: "Noise opacity" },
  noiseBlendMode: { uiTarget: "background", role: "muted", state: "default", label: "Noise blend mode" },
  vignetteColor: { uiTarget: "background", role: "muted", state: "default", label: "Vignette color" },
  vignetteOpacity: { uiTarget: "background", role: "muted", state: "default", label: "Vignette opacity" },

  cardBg: { uiTarget: "background", role: "secondary", state: "default", label: "Card background", supportsMetallic: true },
  cardBorder: { uiTarget: "border", role: "secondary", state: "default", label: "Card border" },
  cardShadow: { uiTarget: "shadow", role: "muted", state: "default", label: "Card shadow" },
  cardGlow: { uiTarget: "accent", role: "info", state: "default", label: "Card glow" },
  cardBlur: { uiTarget: "background", role: "muted", state: "default", label: "Card blur" },
  cardRadius: { uiTarget: "border", role: "muted", state: "default", label: "Card radius" },

  fontFamily: { uiTarget: "text", role: "primary", state: "default", label: "Font family" },
  textPrimary: { uiTarget: "text", role: "primary", state: "default", label: "Text primary" },
  textMuted: { uiTarget: "text", role: "muted", state: "default", label: "Text muted" },
  textLabel: { uiTarget: "text", role: "secondary", state: "default", label: "Text label" },
  textSizeBody: { uiTarget: "text", role: "primary", state: "default", label: "Text size body" },
  textSizeSmall: { uiTarget: "text", role: "muted", state: "default", label: "Text size small" },
  textSizeSubtitle: { uiTarget: "text", role: "secondary", state: "default", label: "Text size subtitle" },
  textSizeTiny: { uiTarget: "text", role: "muted", state: "default", label: "Text size tiny" },
  textWeightTitle: { uiTarget: "text", role: "primary", state: "default", label: "Text weight title" },
  textWeightButton: { uiTarget: "text", role: "primary", state: "default", label: "Text weight button" },
  textWeightSwitch: { uiTarget: "text", role: "secondary", state: "default", label: "Text weight switch" },
  logoLetterSpacing: { uiTarget: "text", role: "secondary", state: "default", label: "Logo letter spacing" },
  adminLetterSpacing: { uiTarget: "text", role: "secondary", state: "default", label: "Admin letter spacing" },

  inputBg: { uiTarget: "input", role: "primary", state: "default", label: "Input background" },
  inputBorder: { uiTarget: "border", role: "secondary", state: "default", label: "Input border" },
  inputText: { uiTarget: "text", role: "primary", state: "default", label: "Input text" },
  inputPlaceholder: { uiTarget: "text", role: "muted", state: "default", label: "Input placeholder" },
  inputIcon: { uiTarget: "icon", role: "muted", state: "default", label: "Input icon" },

  buttonBg0: { uiTarget: "button", role: "primary", state: "default", label: "Button gradient start" },
  buttonBg1: { uiTarget: "button", role: "primary", state: "default", label: "Button gradient end" },
  buttonText: { uiTarget: "text", role: "primary", state: "default", label: "Button text" },
  buttonGlow: { uiTarget: "shadow", role: "info", state: "default", label: "Button glow" },
  buttonLetterSpacing: { uiTarget: "text", role: "secondary", state: "default", label: "Button letter spacing" },

  linkColor: { uiTarget: "link", role: "info", state: "default", label: "Link color" },
  focusRing: { uiTarget: "border", role: "info", state: "focus", label: "Focus ring" },

  switchBg: { uiTarget: "button", role: "secondary", state: "default", label: "Switch background" },
  switchBorder: { uiTarget: "border", role: "secondary", state: "default", label: "Switch border" },
  switchText: { uiTarget: "text", role: "secondary", state: "default", label: "Switch text" },
  switchActiveBg: { uiTarget: "button", role: "primary", state: "selected", label: "Switch active bg" },
  switchActiveText: { uiTarget: "text", role: "primary", state: "selected", label: "Switch active text" },
  checkboxAccent: { uiTarget: "accent", role: "info", state: "selected", label: "Checkbox accent" }
} as const;
