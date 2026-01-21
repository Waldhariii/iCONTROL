export type CpLoginThemePresetName = "midnightPurple" | "steelBlue" | "graphite";

export type CpLoginTheme = {
  bgGradient0: string;
  bgGradient1: string;
  bgGradient2: string;
  noise: string;
  noiseOpacity: string;
  noiseBlendMode: string;
  vignetteColor: string;
  vignetteOpacity: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardGlow: string;
  cardBlur: string;
  cardRadius: string;
  fontFamily: string;
  textPrimary: string;
  textMuted: string;
  textLabel: string;
  textSizeBody: string;
  textSizeSmall: string;
  textSizeSubtitle: string;
  textSizeTiny: string;
  textWeightTitle: string;
  textWeightButton: string;
  textWeightSwitch: string;
  logoLetterSpacing: string;
  adminLetterSpacing: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  inputIcon: string;
  buttonBg0: string;
  buttonBg1: string;
  buttonText: string;
  buttonGlow: string;
  buttonLetterSpacing: string;
  linkColor: string;
  focusRing: string;
  switchBg: string;
  switchBorder: string;
  switchText: string;
  switchActiveBg: string;
  switchActiveText: string;
  checkboxAccent: string;
  layout: {
    cardWidth: string;
    cardPadding: string;
    cardGap: string;
    headerGap: string;
    headerStackGap: string;
    logoSize: string;
    adminSize: string;
    switchHeight: string;
    switchPadding: string;
    switchGap: string;
    switchFontSize: string;
    switchButtonPadding: string;
    switchRadius: string;
    switchButtonRadius: string;
    inputHeight: string;
    inputRadius: string;
    inputGap: string;
    inputInnerGap: string;
    inputIconSize: string;
    inputPadding: string;
    buttonHeight: string;
    buttonRadius: string;
    footerGap: string;
    footerLinkGap: string;
    footerCheckboxGap: string;
    errorMinHeight: string;
  };
};

export const DEFAULT_CP_LOGIN_PRESET: CpLoginThemePresetName = "midnightPurple";

export const CP_LOGIN_THEMES: Record<CpLoginThemePresetName, CpLoginTheme> = {
  midnightPurple: {
    bgGradient0: "radial-gradient(1200px 600px at 12% 10%, rgba(79,70,229,0.35), transparent 60%)",
    bgGradient1: "radial-gradient(900px 600px at 88% 12%, rgba(99,102,241,0.25), transparent 58%)",
    bgGradient2: "linear-gradient(160deg, #0b0f15 0%, #0c121a 45%, #0b0f15 100%)",
    noise: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.35'/></svg>\")",
    noiseOpacity: "0.12",
    noiseBlendMode: "soft-light",
    vignetteColor: "0,0,0",
    vignetteOpacity: "0.55",
    cardBg: "rgba(12,17,23,0.72)",
    cardBorder: "1px solid rgba(148,163,184,0.2)",
    cardShadow: "0 24px 70px rgba(0,0,0,0.55)",
    cardGlow: "0 0 80px rgba(99,102,241,0.18)",
    cardBlur: "16px",
    cardRadius: "24px",
    fontFamily: "\"Manrope\", \"SF Pro Text\", Segoe UI, Arial, sans-serif",
    textPrimary: "#e5e7eb",
    textMuted: "#9ca3af",
    textLabel: "#cbd5f5",
    textSizeBody: "13px",
    textSizeSmall: "12px",
    textSizeSubtitle: "13px",
    textSizeTiny: "11px",
    textWeightTitle: "700",
    textWeightButton: "700",
    textWeightSwitch: "600",
    logoLetterSpacing: "0.2em",
    adminLetterSpacing: "0.35em",
    inputBg: "rgba(12,17,23,0.6)",
    inputBorder: "1px solid rgba(148,163,184,0.24)",
    inputText: "#e5e7eb",
    inputPlaceholder: "rgba(148,163,184,0.8)",
    inputIcon: "#94a3b8",
    buttonBg0: "#4f46e5",
    buttonBg1: "#7c3aed",
    buttonText: "#f8fafc",
    buttonGlow: "0 0 16px rgba(99,102,241,0.55)",
    buttonLetterSpacing: "0.02em",
    linkColor: "#93c5fd",
    focusRing: "0 0 0 2px rgba(99,102,241,0.6)",
    switchBg: "rgba(15,20,27,0.6)",
    switchBorder: "1px solid rgba(148,163,184,0.2)",
    switchText: "#94a3b8",
    switchActiveBg: "#4f46e5",
    switchActiveText: "#f8fafc",
    checkboxAccent: "#4f46e5",
    layout: {
      cardWidth: "460px",
      cardPadding: "28px",
      cardGap: "18px",
      headerGap: "12px",
      headerStackGap: "6px",
      logoSize: "16px",
      adminSize: "11px",
      switchHeight: "28px",
      switchPadding: "2px",
      switchGap: "6px",
      switchFontSize: "11px",
      switchButtonPadding: "4px 10px",
      switchRadius: "999px",
      switchButtonRadius: "999px",
      inputHeight: "44px",
      inputRadius: "12px",
      inputGap: "12px",
      inputInnerGap: "10px",
      inputIconSize: "16px",
      inputPadding: "0 14px",
      buttonHeight: "44px",
      buttonRadius: "12px",
      footerGap: "12px",
      footerLinkGap: "12px",
      footerCheckboxGap: "8px",
      errorMinHeight: "16px"
    }
  },
  steelBlue: {
    bgGradient0: "radial-gradient(1200px 600px at 12% 10%, rgba(14,116,144,0.35), transparent 60%)",
    bgGradient1: "radial-gradient(900px 600px at 88% 12%, rgba(56,189,248,0.25), transparent 58%)",
    bgGradient2: "linear-gradient(160deg, #0a1218 0%, #0c151c 45%, #0a1218 100%)",
    noise: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.35'/></svg>\")",
    noiseOpacity: "0.12",
    noiseBlendMode: "soft-light",
    vignetteColor: "0,0,0",
    vignetteOpacity: "0.55",
    cardBg: "rgba(10,16,22,0.72)",
    cardBorder: "1px solid rgba(148,163,184,0.2)",
    cardShadow: "0 24px 70px rgba(0,0,0,0.55)",
    cardGlow: "0 0 80px rgba(56,189,248,0.18)",
    cardBlur: "16px",
    cardRadius: "24px",
    fontFamily: "\"Manrope\", \"SF Pro Text\", Segoe UI, Arial, sans-serif",
    textPrimary: "#e5e7eb",
    textMuted: "#94a3b8",
    textLabel: "#bae6fd",
    textSizeBody: "13px",
    textSizeSmall: "12px",
    textSizeSubtitle: "13px",
    textSizeTiny: "11px",
    textWeightTitle: "700",
    textWeightButton: "700",
    textWeightSwitch: "600",
    logoLetterSpacing: "0.2em",
    adminLetterSpacing: "0.35em",
    inputBg: "rgba(10,16,22,0.6)",
    inputBorder: "1px solid rgba(148,163,184,0.24)",
    inputText: "#e5e7eb",
    inputPlaceholder: "rgba(148,163,184,0.8)",
    inputIcon: "#94a3b8",
    buttonBg0: "#0284c7",
    buttonBg1: "#0ea5e9",
    buttonText: "#f8fafc",
    buttonGlow: "0 0 16px rgba(14,165,233,0.55)",
    buttonLetterSpacing: "0.02em",
    linkColor: "#7dd3fc",
    focusRing: "0 0 0 2px rgba(14,165,233,0.6)",
    switchBg: "rgba(10,18,24,0.6)",
    switchBorder: "1px solid rgba(148,163,184,0.2)",
    switchText: "#94a3b8",
    switchActiveBg: "#0284c7",
    switchActiveText: "#f8fafc",
    checkboxAccent: "#0284c7",
    layout: {
      cardWidth: "460px",
      cardPadding: "28px",
      cardGap: "18px",
      headerGap: "12px",
      headerStackGap: "6px",
      logoSize: "16px",
      adminSize: "11px",
      switchHeight: "28px",
      switchPadding: "2px",
      switchGap: "6px",
      switchFontSize: "11px",
      switchButtonPadding: "4px 10px",
      switchRadius: "999px",
      switchButtonRadius: "999px",
      inputHeight: "44px",
      inputRadius: "12px",
      inputGap: "12px",
      inputInnerGap: "10px",
      inputIconSize: "16px",
      inputPadding: "0 14px",
      buttonHeight: "44px",
      buttonRadius: "12px",
      footerGap: "12px",
      footerLinkGap: "12px",
      footerCheckboxGap: "8px",
      errorMinHeight: "16px"
    }
  },
  graphite: {
    bgGradient0: "radial-gradient(1200px 600px at 12% 10%, rgba(71,85,105,0.28), transparent 62%)",
    bgGradient1: "radial-gradient(900px 600px at 88% 12%, rgba(30,41,59,0.35), transparent 60%)",
    bgGradient2: "linear-gradient(160deg, #0b0f13 0%, #0f141b 45%, #0b0f13 100%)",
    noise: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.35'/></svg>\")",
    noiseOpacity: "0.12",
    noiseBlendMode: "soft-light",
    vignetteColor: "0,0,0",
    vignetteOpacity: "0.6",
    cardBg: "rgba(12,17,22,0.78)",
    cardBorder: "1px solid rgba(148,163,184,0.18)",
    cardShadow: "0 24px 70px rgba(0,0,0,0.6)",
    cardGlow: "0 0 80px rgba(148,163,184,0.16)",
    cardBlur: "16px",
    cardRadius: "24px",
    fontFamily: "\"Manrope\", \"SF Pro Text\", Segoe UI, Arial, sans-serif",
    textPrimary: "#e5e7eb",
    textMuted: "#9aa3b2",
    textLabel: "#cbd5f5",
    textSizeBody: "13px",
    textSizeSmall: "12px",
    textSizeSubtitle: "13px",
    textSizeTiny: "11px",
    textWeightTitle: "700",
    textWeightButton: "700",
    textWeightSwitch: "600",
    logoLetterSpacing: "0.2em",
    adminLetterSpacing: "0.35em",
    inputBg: "rgba(12,17,22,0.6)",
    inputBorder: "1px solid rgba(148,163,184,0.2)",
    inputText: "#e5e7eb",
    inputPlaceholder: "rgba(148,163,184,0.8)",
    inputIcon: "#9aa3b2",
    buttonBg0: "#1f2937",
    buttonBg1: "#374151",
    buttonText: "#f8fafc",
    buttonGlow: "0 0 12px rgba(148,163,184,0.4)",
    buttonLetterSpacing: "0.02em",
    linkColor: "#cbd5f5",
    focusRing: "0 0 0 2px rgba(148,163,184,0.5)",
    switchBg: "rgba(15,20,27,0.6)",
    switchBorder: "1px solid rgba(148,163,184,0.18)",
    switchText: "#9aa3b2",
    switchActiveBg: "#374151",
    switchActiveText: "#f8fafc",
    checkboxAccent: "#374151",
    layout: {
      cardWidth: "460px",
      cardPadding: "28px",
      cardGap: "18px",
      headerGap: "12px",
      headerStackGap: "6px",
      logoSize: "16px",
      adminSize: "11px",
      switchHeight: "28px",
      switchPadding: "2px",
      switchGap: "6px",
      switchFontSize: "11px",
      switchButtonPadding: "4px 10px",
      switchRadius: "999px",
      switchButtonRadius: "999px",
      inputHeight: "44px",
      inputRadius: "12px",
      inputGap: "12px",
      inputInnerGap: "10px",
      inputIconSize: "16px",
      inputPadding: "0 14px",
      buttonHeight: "44px",
      buttonRadius: "12px",
      footerGap: "12px",
      footerLinkGap: "12px",
      footerCheckboxGap: "8px",
      errorMinHeight: "16px"
    }
  }
};

export function getCpLoginPreset(): CpLoginThemePresetName {
  if (typeof window === "undefined") return DEFAULT_CP_LOGIN_PRESET;
  const search = new URLSearchParams(window.location.search);
  if (search.has("theme")) {
    return normalizePreset(search.get("theme"));
  }
  const hash = window.location.hash || "";
  const queryIndex = hash.indexOf("?");
  if (queryIndex !== -1) {
    const hashQuery = hash.slice(queryIndex + 1);
    return normalizePreset(new URLSearchParams(hashQuery).get("theme"));
  }
  return DEFAULT_CP_LOGIN_PRESET;
}

function normalizePreset(value: string | null): CpLoginThemePresetName {
  if (value === "steelBlue") return "steelBlue";
  if (value === "graphite") return "graphite";
  return DEFAULT_CP_LOGIN_PRESET;
}
