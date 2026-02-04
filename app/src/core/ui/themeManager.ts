/**
 * ICONTROL_THEME_MANAGER_V1
 * 
 * Theme Manager: Gestion centralisée des tokens CSS et thèmes
 * 
 * Principe:
 * - Le visuel dépend uniquement de tokens (couleurs, spacing, radius, typography)
 * - Modifier les tokens / le thème → tout change visuellement, sans toucher aux pages
 * - Support dark/light mode
 * - Tokens SSOT (Single Source Of Truth)
 */

import { webStorage } from "../../platform/storage/webStorage";
import { getLogger } from "../utils/logger";
import { isEnabled } from "../../policies/feature_flags.enforce";
import { createAuditHook } from "../write-gateway/auditHook";
import { createLegacyAdapter } from "../write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "../write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "../write-gateway/writeGateway";
import { getTenantId } from "../runtime/tenant";

const logger = getLogger("THEME_MANAGER");
const shadowLogger = getLogger("WRITE_GATEWAY_THEME");
let themeGateway: ReturnType<typeof createWriteGateway> | null = null;

function resolveThemeGateway() {
  if (themeGateway) return themeGateway;
  themeGateway = createWriteGateway({
    policy: createPolicyHook(),
    audit: createAuditHook(),
    adapter: createLegacyAdapter((cmd) => {
      void cmd;
      return { status: "SKIPPED", correlationId: cmd.correlationId };
    }, "themeShadowNoop"),
    safeMode: { enabled: true },
  });
  return themeGateway;
}

function isThemeShadowEnabled(): boolean {
  try {
    const rt: any = globalThis as any;
    const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
    if (Array.isArray(decisions)) return isEnabled(decisions, "theme_shadow");
    const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
    const state = flags?.theme_shadow?.state;
    return state === "ON" || state === "ROLLOUT";
  } catch {
    return false;
  }
}

export type ThemeMode = "light" | "dark" | "auto";

export interface ThemeTokens {
  // Couleurs
  bg: string;
  panel: string;
  card: string;
  border: string;
  text: string;
  mutedText: string;
  accent: string;
  accent2: string;
  
  // Spacing
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // Typography
  font: string;
  mono: string;
  titleSize: number;
  
  // Effects
  radius: number;
  shadow: string;
}

export interface Theme {
  name: string;
  mode: ThemeMode;
  tokens: ThemeTokens;
}

// Valeurs par défaut alignées avec le système original (coreStyles.ts et MAIN_SYSTEM_THEME)
const DEFAULT_TOKENS: ThemeTokens = {
  bg: "var(--icontrol-color-fallback-fg)", // Aligné avec coreStyles.ts
  panel: "var(--icontrol-color-fallback-fg)", // Aligné avec coreStyles.ts
  card: "var(--icontrol-color-fallback-fg)", // Aligné avec coreStyles.ts --bg-card
  border: "var(--icontrol-color-fallback-fg)", // Aligné avec coreStyles.ts --line
  text: "var(--icontrol-color-fallback-fg)", // Aligné avec coreStyles.ts
  mutedText: "var(--icontrol-color-fallback-fg)", // Aligné avec coreStyles.ts --muted
  accent: "var(--icontrol-color-fallback-fg)", // Aligné avec coreStyles.ts (violet original)
  accent2: "var(--icontrol-color-fallback-fg)", // Aligné avec coreStyles.ts
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px"
  },
  font: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", Segoe UI, Roboto, Helvetica, Arial, sans-serif", // Aligné avec coreStyles.ts
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  titleSize: 42,
  radius: 18, // Aligné avec coreStyles.ts
  shadow: "0 18px 50px var(--ic-text-primary)" // Aligné avec coreStyles.ts
};

const LIGHT_TOKENS: ThemeTokens = {
  ...DEFAULT_TOKENS,
  bg: "var(--icontrol-color-fallback-fg)",
  panel: "var(--icontrol-color-fallback-fg)",
  card: "var(--icontrol-color-fallback-fg)",
  border: "var(--icontrol-color-fallback-fg)",
  text: "var(--icontrol-color-fallback-fg)",
  mutedText: "var(--icontrol-color-fallback-fg)",
  accent: "var(--icontrol-color-fallback-fg)", // Garder le violet même en light mode
  accent2: "var(--icontrol-color-fallback-fg)",
  shadow: "0 2px 8px var(--ic-text-primary)"
};

class ThemeManager {
  private currentTheme: Theme;
  private listeners: Array<(theme: Theme) => void> = [];

  constructor() {
    // Charger le thème depuis localStorage ou utiliser le défaut
    const saved = this.loadTheme();
    this.currentTheme = saved || {
      name: "default",
      mode: "dark",
      tokens: DEFAULT_TOKENS
    };
    
    // NE PAS appliquer automatiquement au démarrage pour éviter les conflits
    // Le système original (applyThemeTokensToCSSVars) gère déjà les tokens
    // this.applyTheme(this.currentTheme);
  }

  /**
   * Applique un thème (met à jour les CSS variables)
   */
  applyTheme(theme: Theme): void {
    const root = document.documentElement;
    const tokens = theme.tokens;
    
    // Couleurs
    root.style.setProperty("--ic-bg", tokens.bg);
    root.style.setProperty("--ic-panel", tokens.panel);
    root.style.setProperty("--ic-card", tokens.card);
    root.style.setProperty("--ic-border", tokens.border);
    root.style.setProperty("--ic-text", tokens.text);
    root.style.setProperty("--ic-mutedText", tokens.mutedText);
    root.style.setProperty("--ic-accent", tokens.accent);
    root.style.setProperty("--ic-accent2", tokens.accent2);
    
    // Spacing
    root.style.setProperty("--ic-spacing-xs", tokens.spacing.xs);
    root.style.setProperty("--ic-spacing-sm", tokens.spacing.sm);
    root.style.setProperty("--ic-spacing-md", tokens.spacing.md);
    root.style.setProperty("--ic-spacing-lg", tokens.spacing.lg);
    root.style.setProperty("--ic-spacing-xl", tokens.spacing.xl);
    
    // Typography
    root.style.setProperty("--ic-font", tokens.font);
    root.style.setProperty("--ic-mono", tokens.mono);
    root.style.setProperty("--ic-title-size", `${tokens.titleSize}px`);
    
    // Effects
    root.style.setProperty("--ic-radius", `${tokens.radius}px`);
    root.style.setProperty("--ic-shadow", tokens.shadow);
    
    this.currentTheme = theme;
    this.saveTheme(theme);
    this.notifyListeners(theme);
    
    logger.debug("THEME_MANAGER_APPLIED", { themeName: theme.name, mode: theme.mode });
  }

  /**
   * Change le mode (light/dark/auto)
   */
  setMode(mode: ThemeMode): void {
    let tokens = DEFAULT_TOKENS;
    
    if (mode === "light") {
      tokens = LIGHT_TOKENS;
    } else if (mode === "dark") {
      tokens = DEFAULT_TOKENS;
    } else if (mode === "auto") {
      // Détecter la préférence système
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      tokens = prefersDark ? DEFAULT_TOKENS : LIGHT_TOKENS;
    }
    
    this.applyTheme({
      ...this.currentTheme,
      mode,
      tokens
    });
  }

  /**
   * Obtient le thème actuel
   */
  getTheme(): Theme {
    return { ...this.currentTheme };
  }

  /**
   * Obtient les tokens actuels
   */
  getTokens(): ThemeTokens {
    return { ...this.currentTheme.tokens };
  }

  /**
   * Met à jour des tokens spécifiques
   */
  updateTokens(updates: Partial<ThemeTokens>): void {
    this.applyTheme({
      ...this.currentTheme,
      tokens: {
        ...this.currentTheme.tokens,
        ...updates
      }
    });
  }

  /**
   * S'abonner aux changements de thème
   */
  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => {
      try {
        listener(theme);
      } catch (e) {
        logger.warn("THEME_MANAGER_LISTENER_ERROR", String(e));
      }
    });
  }

  private saveTheme(theme: Theme): void {
    try {
      const guard = (globalThis as any).__ICONTROL_CLIENT_STYLE_GUARD__;
      if (guard?.disableLocalOverrides) return;
      webStorage.set("icontrol_theme", JSON.stringify(theme));
    } catch (e) {
      logger.warn("THEME_MANAGER_SAVE_FAILED", String(e));
    }

    if (!isThemeShadowEnabled()) return;

    const correlationId = createCorrelationId("theme");
    const tenantId = getTenantId();
    const cmd = {
      kind: "THEME_SET",
      tenantId,
      correlationId,
      payload: theme,
      meta: { shadow: true, source: "themeManager", key: "icontrol_theme" },
    };

    try {
      const res = resolveThemeGateway().execute(cmd as any);
      if (res.status !== "OK" && res.status !== "SKIPPED") {
        shadowLogger.warn("WRITE_GATEWAY_THEME_FALLBACK", {
          kind: cmd.kind,
          tenant_id: tenantId,
          correlation_id: correlationId,
          status: res.status,
        });
      }
    } catch (err) {
      shadowLogger.warn("WRITE_GATEWAY_THEME_ERROR", {
        kind: cmd.kind,
        tenant_id: tenantId,
        correlation_id: correlationId,
        error: String(err),
      });
    }
  }

  private loadTheme(): Theme | null {
    try {
      const guard = (globalThis as any).__ICONTROL_CLIENT_STYLE_GUARD__;
      if (guard?.disableLocalOverrides) return null;
      const saved = webStorage.get("icontrol_theme");
      if (saved) {
        return JSON.parse(saved) as Theme;
      }
    } catch (e) {
      logger.warn("THEME_MANAGER_LOAD_FAILED", String(e));
    }
    return null;
  }
}

// Instance singleton globale
let globalThemeManager: ThemeManager | null = null;

export function getThemeManager(): ThemeManager {
  if (!globalThemeManager) {
    globalThemeManager = new ThemeManager();
  }
  return globalThemeManager;
}

/**
 * Helper pour obtenir une variable CSS
 */
export function cssVar(name: string, fallback?: string): string {
  return fallback ? `var(--ic-${name}, ${fallback})` : `var(--ic-${name})`;
}
