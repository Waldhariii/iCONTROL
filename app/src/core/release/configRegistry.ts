/**
 * ICONTROL_CONFIG_REGISTRY_V1
 * Config Registry - Gestion des configurations DRAFT → PREVIEW → PUBLISH
 * 
 * Ce module gère :
 * - DRAFT : modifications invisibles (admin only)
 * - PREVIEW : validation QA + simulation RBAC/SAFE_MODE
 * - PUBLISHED : version figée (clients)
 */

export type ConfigChannel = "draft" | "preview" | "published";

export interface ConfigSnapshot {
  version: string;
  pages: PageConfig[];
  tables: TableConfig[];
  tabs: TabConfig[];
  featureFlags: FeatureFlagConfig[];
  uiTokens: UITokenConfig[];
  layout: LayoutConfig;
  theme: ThemeConfig;
  createdAt: string; // ISO date
}

export interface PageConfig {
  id: string;
  title: string;
  path: string;
  visible: boolean;
  roles: string[];
  order: number;
}

export interface TableConfig {
  id: string;
  pageId: string;
  columns: ColumnConfig[];
  actions: ActionConfig[];
  visible: boolean;
}

export interface ColumnConfig {
  id: string;
  label: string;
  type: "text" | "date" | "money" | "badge" | "action";
  visible: boolean;
  order: number;
}

export interface ActionConfig {
  id: string;
  label: string;
  type: "navigate" | "openModal" | "exportCsv" | "noop";
  visible: boolean;
  roles: string[];
}

export interface TabConfig {
  id: string;
  pageId: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface FeatureFlagConfig {
  id: string;
  enabled: boolean;
  rollout?: number; // 0-100
  roles?: string[];
  tenants?: string[];
}

export interface UITokenConfig {
  key: string;
  value: string;
  category: "color" | "spacing" | "typography" | "layout";
}

export interface LayoutConfig {
  topbarHeight: number;
  drawerWidth: number;
  maxWidth: number;
  pagePadding: number;
  menuOrder: string[];
}

export interface ThemeConfig {
  tokens: Record<string, string>;
  logos: {
    light: string;
    dark: string;
  };
}

export interface ConfigVersion {
  version: string;
  channel: ConfigChannel;
  createdAt: string;
  publishedAt?: string; // ISO date (si channel === "published")
  snapshot: ConfigSnapshot;
}

const LS_KEY_CONFIG_REGISTRY = "icontrol_config_registry";

/**
 * Charge toutes les configurations (draft, preview, published)
 */
export function loadConfigRegistry(): {
  draft: ConfigVersion | null;
  preview: ConfigVersion | null;
  published: ConfigVersion | null;
} {
  if (typeof window === "undefined" || !window.localStorage) {
    return { draft: null, preview: null, published: null };
  }

  try {
    const raw = localStorage.getItem(LS_KEY_CONFIG_REGISTRY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        draft: parsed.draft || null,
        preview: parsed.preview || null,
        published: parsed.published || null,
      };
    }
  } catch (e) {
    console.warn("Failed to load config registry from localStorage", e);
  }

  return { draft: null, preview: null, published: null };
}

/**
 * Sauvegarde une configuration dans un canal spécifique
 */
export function saveConfigVersion(
  channel: ConfigChannel,
  config: ConfigVersion
): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    const registry = loadConfigRegistry();
    const updated = {
      ...registry,
      [channel]: config,
    };
    localStorage.setItem(LS_KEY_CONFIG_REGISTRY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save config version to localStorage", e);
  }
}

/**
 * Charge la configuration publiée (pour les clients)
 */
export function loadPublishedConfig(): ConfigSnapshot | null {
  const registry = loadConfigRegistry();
  return registry.published?.snapshot || null;
}

/**
 * Charge la configuration draft (admin only)
 */
export function loadDraftConfig(): ConfigSnapshot | null {
  const registry = loadConfigRegistry();
  return registry.draft?.snapshot || null;
}

/**
 * Charge la configuration preview (admin/QA only)
 */
export function loadPreviewConfig(): ConfigSnapshot | null {
  const registry = loadConfigRegistry();
  return registry.preview?.snapshot || null;
}

/**
 * Crée un snapshot immuable d'une configuration
 */
export function createConfigSnapshot(
  config: Partial<ConfigSnapshot>,
  version: string
): ConfigSnapshot {
  const now = new Date().toISOString();
  return {
    version,
    pages: config.pages || [],
    tables: config.tables || [],
    tabs: config.tabs || [],
    featureFlags: config.featureFlags || [],
    uiTokens: config.uiTokens || [],
    layout: config.layout || {
      topbarHeight: 74,
      drawerWidth: 320,
      maxWidth: 1220,
      pagePadding: 18,
      menuOrder: [],
    },
    theme: config.theme || {
      tokens: {},
      logos: { light: "", dark: "" },
    },
    createdAt: now,
  };
}
