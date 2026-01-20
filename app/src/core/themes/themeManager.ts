/**
 * ICONTROL_THEME_MANAGER_V1
 * Gestionnaire de thèmes et personnalisation
 */

export type ThemeId = "dark" | "light" | "auto";

export interface Theme {
  id: ThemeId;
  name: string;
  colors: {
    background: string;
    panel: string;
    card: string;
    text: string;
    mutedText: string;
    border: string;
    accent: string;
  };
}

const THEMES: Record<ThemeId, Theme> = {
  dark: {
    id: "dark",
    name: "Sombre",
    colors: {
      background: "#0f1112",
      panel: "#1a1d1f",
      card: "#1e1e1e",
      text: "#e7ecef",
      mutedText: "#a7b0b7",
      border: "#2b3136",
      accent: "#7b2cff"
    }
  },
  light: {
    id: "light",
    name: "Clair",
    colors: {
      background: "#ffffff",
      panel: "#f5f5f5",
      card: "#ffffff",
      text: "#1a1a1a",
      mutedText: "#666666",
      border: "#e0e0e0",
      accent: "#3b82f6"
    }
  },
  auto: {
    id: "auto",
    name: "Automatique",
    colors: {
      background: "var(--system-bg)",
      panel: "var(--system-panel)",
      card: "var(--system-card)",
      text: "var(--system-text)",
      mutedText: "var(--system-muted)",
      border: "var(--system-border)",
      accent: "var(--system-accent)"
    }
  }
};

class ThemeManager {
  private currentTheme: ThemeId = "dark";

  getCurrentTheme(): ThemeId {
    const stored = localStorage.getItem("icontrol_theme");
    if (stored && (stored === "dark" || stored === "light" || stored === "auto")) {
      this.currentTheme = stored;
    }
    return this.currentTheme;
  }

  setTheme(themeId: ThemeId) {
    this.currentTheme = themeId;
    localStorage.setItem("icontrol_theme", themeId);
    this.applyTheme(themeId);
  }

  getTheme(themeId?: ThemeId): Theme {
    const id = themeId || this.getCurrentTheme();
    return THEMES[id] || THEMES.dark;
  }

  applyTheme(themeId: ThemeId) {
    const theme = this.getTheme(themeId);

    if (themeId === "auto") {
      // Détecter préférence système
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const activeTheme = prefersDark ? THEMES.dark : THEMES.light;
      this.applyThemeColors(activeTheme);
    } else {
      this.applyThemeColors(theme);
    }

    // Écouter changements préférence système pour "auto"
    if (themeId === "auto") {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        const activeTheme = e.matches ? THEMES.dark : THEMES.light;
        this.applyThemeColors(activeTheme);
      });
    }
  }

  private applyThemeColors(theme: Theme) {
    const root = document.documentElement;
    root.style.setProperty("--ic-bg", theme.colors.background);
    root.style.setProperty("--ic-panel", theme.colors.panel);
    root.style.setProperty("--ic-card", theme.colors.card);
    root.style.setProperty("--ic-text", theme.colors.text);
    root.style.setProperty("--ic-mutedText", theme.colors.mutedText);
    root.style.setProperty("--ic-border", theme.colors.border);
    root.style.setProperty("--ic-accent", theme.colors.accent);
  }

  initialize() {
    const savedTheme = this.getCurrentTheme();
    this.applyTheme(savedTheme);
  }

  listThemes(): Theme[] {
    return Object.values(THEMES);
  }
}

export const themeManager = new ThemeManager();

// Initialiser au chargement
if (typeof document !== "undefined") {
  themeManager.initialize();
}
